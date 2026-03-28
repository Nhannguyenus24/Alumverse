package com.service.backend.forum.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.service.backend.forum.dto.CreatePollRequest;
import com.service.backend.forum.dto.CreatePollVoteRequest;
import com.service.backend.forum.dto.PollDTO;
import com.service.backend.forum.dto.PollOptionDTO;
import com.service.backend.forum.dto.PollVoteDTO;
import com.service.backend.forum.entity.Poll;
import com.service.backend.forum.entity.PollOption;
import com.service.backend.forum.entity.PollVote;
import com.service.backend.forum.dao.PollRepository;
import com.service.backend.forum.dao.PollOptionRepository;
import com.service.backend.forum.dao.PollVoteRepository;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
public class PollService {
    private static final Logger log = LoggerFactory.getLogger(PollService.class);

    private final PollRepository pollRepository;
    private final PollOptionRepository pollOptionRepository;
    private final PollVoteRepository pollVoteRepository;

    public PollService(PollRepository pollRepository,
                       PollOptionRepository pollOptionRepository,
                       PollVoteRepository pollVoteRepository) {
        this.pollRepository = pollRepository;
        this.pollOptionRepository = pollOptionRepository;
        this.pollVoteRepository = pollVoteRepository;
    }

    // Create new poll
    public Mono<PollDTO> createPoll(CreatePollRequest request) {
        log.info("Creating new poll: {}", request.getTitle());

        Poll poll = Poll.builder()
                .topicId(request.getTopicId())
                .organizationId(request.getOrganizationId())
                .createdByMemberId(request.getCreatedByMemberId())
                .title(request.getTitle())
                .description(request.getDescription())
                .allowMultipleVotes(request.getAllowMultipleVotes() != null ? request.getAllowMultipleVotes() : false)
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        return pollRepository.save(poll)
                .flatMap(savedPoll -> {
                    // Create poll options
                    List<PollOption> options = new ArrayList<>();
                    if (request.getOptions() != null && !request.getOptions().isEmpty()) {
                        for (String optionText : request.getOptions()) {
                            PollOption option = PollOption.builder()
                                    .pollId(savedPoll.getId())
                                    .optionText(optionText)
                                    .voteCount(0)
                                    .createdAt(LocalDateTime.now())
                                    .updatedAt(LocalDateTime.now())
                                    .build();
                            options.add(option);
                        }
                    }

                    return Flux.fromIterable(options)
                            .flatMap(pollOptionRepository::save)
                            .collectList()
                            .map(savedOptions -> convertToPollDTO(savedPoll, savedOptions));
                })
                .doOnSuccess(result -> log.info("Successfully created poll with ID: {}", result.getId()))
                .doOnError(error -> log.error("Error creating poll: {}", request.getTitle(), error));
    }

    // Get poll by ID with vote counts
    public Mono<PollDTO> getPollById(Integer pollId, Integer memberId) {

        return pollRepository.findById(pollId)
                .switchIfEmpty(Mono.defer(() -> {
                    log.warn("Poll not found with ID: {}", pollId);
                    return Mono.error(new RuntimeException("Poll not found"));
                }))
                .flatMap(poll -> 
                    pollOptionRepository.findByPollId(poll.getId())
                            .flatMap(option -> 
                                pollVoteRepository.countByPollOptionId(option.getId())
                                        .map(count -> {
                                            option.setVoteCount(count.intValue());
                                            return option;
                                        })
                            )
                            .collectList()
                            .map(options -> convertToPollDTOWithMemberVote(poll, options, memberId))
                )
                .doOnSuccess(result -> log.info("Successfully retrieved poll with ID: {}", pollId))
                .doOnError(error -> log.error("Error getting poll ID: {}", pollId, error));
    }

    // Get all polls by topic
    public Flux<PollDTO> getPollsByTopicId(Integer topicId, Integer memberId) {
        log.info("Getting all polls for topic ID: {}", topicId);

        return pollRepository.findByTopicId(topicId)
                .flatMap(poll -> 
                    pollOptionRepository.findByPollId(poll.getId())
                            .flatMap(option -> 
                                pollVoteRepository.countByPollOptionId(option.getId())
                                        .map(count -> {
                                            option.setVoteCount(count.intValue());
                                            return option;
                                        })
                            )
                            .collectList()
                            .map(options -> convertToPollDTOWithMemberVote(poll, options, memberId))
                )
                .doOnComplete(() -> log.info("Successfully retrieved all polls for topic ID: {}", topicId))
                .doOnError(error -> log.error("Error getting polls for topic ID: {}", topicId, error));
    }

    // Vote on a poll option
    public Mono<PollVoteDTO> voteOnPoll(CreatePollVoteRequest request) {
        log.info("Member {} voting on poll {}, option {}", 
                 request.getMemberId(), request.getPollId(), request.getPollOptionId());

        // First, check if poll exists
        return pollRepository.findById(request.getPollId())
                .switchIfEmpty(Mono.error(new RuntimeException("Poll not found")))
                .flatMap(poll -> 
                    // Check if poll option exists
                    pollOptionRepository.findByPollIdAndId(poll.getId(), request.getPollOptionId())
                            .switchIfEmpty(Mono.error(new RuntimeException("Poll option not found")))
                            .flatMap(option -> createVoteIfNotExists(request, option))
                )
                .doOnSuccess(result -> log.info("Successfully recorded vote from member {} on poll {}", request.getMemberId(), request.getPollId()))
                .doOnError(error -> log.error("Error voting on poll: {}", error.getMessage(), error));
    }

    // Helper method to create vote if member hasn't voted yet
    private Mono<PollVoteDTO> createVoteIfNotExists(CreatePollVoteRequest request, PollOption option) {
        return pollVoteRepository.findByPollIdAndMemberId(request.getPollId(), request.getMemberId())
                .flatMap(existingVote -> {
                    log.warn("Member {} already voted on poll {}", request.getMemberId(), request.getPollId());
                    return Mono.<PollVoteDTO>error(new RuntimeException("Member has already voted on this poll"));
                })
                .switchIfEmpty(Mono.defer(() -> createNewVote(request, option)));
    }

    // Helper method to create and save new vote
    private Mono<PollVoteDTO> createNewVote(CreatePollVoteRequest request, PollOption option) {
        PollVote vote = PollVote.builder()
                .pollId(request.getPollId())
                .pollOptionId(request.getPollOptionId())
                .memberId(request.getMemberId())
                .createdAt(LocalDateTime.now())
                .build();

        return pollVoteRepository.save(vote)
                .flatMap(savedVote -> {
                    // Update vote count
                    option.setVoteCount(option.getVoteCount() != null ? option.getVoteCount() + 1 : 1);
                    option.setUpdatedAt(LocalDateTime.now());
                    return pollOptionRepository.save(option)
                            .map(updatedOption -> convertToVoteDTO(savedVote));
                });
    }

    // Remove vote (allow member to change their vote)
    public Mono<Void> removeVote(Integer pollId, Integer memberId) {
        log.info("Removing vote from member {} on poll {}", memberId, pollId);

        return pollVoteRepository.findByPollIdAndMemberId(pollId, memberId)
                .switchIfEmpty(Mono.defer(() -> {
                    log.warn("Vote not found for member {} on poll {}", memberId, pollId);
                    return Mono.error(new RuntimeException("Vote not found"));
                }))
                .flatMap(vote -> {
                    // Decrease vote count
                    return pollOptionRepository.findById(vote.getPollOptionId())
                            .flatMap(option -> {
                                option.setVoteCount(option.getVoteCount() != null ? Math.max(0, option.getVoteCount() - 1) : 0);
                                option.setUpdatedAt(LocalDateTime.now());
                                return pollOptionRepository.save(option);
                            })
                            .then(pollVoteRepository.deleteById(vote.getId()));
                })
                .doOnSuccess(result -> log.info("Successfully removed vote from member {} on poll {}", memberId, pollId))
                .doOnError(error -> log.error("Error removing vote: {}", error.getMessage(), error));
    }

    // Close poll
    public Mono<PollDTO> closePoll(Integer pollId) {

        return pollRepository.findById(pollId)
                .switchIfEmpty(Mono.defer(() -> {
                    log.warn("Poll not found with ID: {}", pollId);
                    return Mono.error(new RuntimeException("Poll not found"));
                }))
                .flatMap(poll -> {
                    poll.setIsActive(false);
                    poll.setUpdatedAt(LocalDateTime.now());
                    return pollRepository.save(poll)
                            .flatMap(updatedPoll -> 
                                pollOptionRepository.findByPollId(updatedPoll.getId())
                                        .collectList()
                                        .map(options -> convertToPollDTO(updatedPoll, options))
                            );
                })
                .doOnSuccess(result -> log.info("Successfully closed poll ID: {}", pollId))
                .doOnError(error -> log.error("Error closing poll ID: {}", pollId, error));
    }

    // Delete poll
    public Mono<Void> deletePoll(Integer pollId) {
        return pollRepository.findById(pollId)
                .switchIfEmpty(Mono.defer(() -> {
                    log.warn("Poll not found with ID: {}", pollId);
                    return Mono.error(new RuntimeException("Poll not found"));
                }))
                .flatMap(poll -> 
                    // Delete all votes first
                    pollVoteRepository.findByPollId(poll.getId())
                            .flatMap(pollVoteRepository::delete)
                            .then()
                            .then(
                                // Delete all options
                                pollOptionRepository.findByPollId(poll.getId())
                                        .flatMap(pollOptionRepository::delete)
                                        .then()
                            )
                            .then(
                                // Delete poll
                                pollRepository.deleteById(poll.getId())
                            )
                )
                .doOnSuccess(result -> log.info("Successfully deleted poll ID: {}", pollId))
                .doOnError(error -> log.error("Error deleting poll ID: {}", pollId, error));
    }

    // Helper methods for conversion
    private PollDTO convertToPollDTO(Poll poll, List<PollOption> options) {
        List<PollOptionDTO> optionDTOs = new ArrayList<>();
        for (PollOption option : options) {
            optionDTOs.add(convertToOptionDTO(option, false));
        }

        return PollDTO.builder()
                .id(poll.getId())
                .topicId(poll.getTopicId())
                .organizationId(poll.getOrganizationId())
                .createdByMemberId(poll.getCreatedByMemberId())
                .title(poll.getTitle())
                .description(poll.getDescription())
                .allowMultipleVotes(poll.getAllowMultipleVotes())
                .isActive(poll.getIsActive())
                .options(optionDTOs)
                .createdAt(poll.getCreatedAt())
                .updatedAt(poll.getUpdatedAt())
                .build();
    }

    private PollDTO convertToPollDTOWithMemberVote(Poll poll, List<PollOption> options, Integer memberId) {
        List<PollOptionDTO> optionDTOs = new ArrayList<>();
        for (PollOption option : options) {
            // This would need to check if memberId voted for this option
            // For simplicity, we'll check it asynchronously in the controller
            optionDTOs.add(convertToOptionDTO(option, false));
        }

        return PollDTO.builder()
                .id(poll.getId())
                .topicId(poll.getTopicId())
                .organizationId(poll.getOrganizationId())
                .createdByMemberId(poll.getCreatedByMemberId())
                .title(poll.getTitle())
                .description(poll.getDescription())
                .allowMultipleVotes(poll.getAllowMultipleVotes())
                .isActive(poll.getIsActive())
                .options(optionDTOs)
                .createdAt(poll.getCreatedAt())
                .updatedAt(poll.getUpdatedAt())
                .build();
    }

    private PollOptionDTO convertToOptionDTO(PollOption option, Boolean hasVoted) {
        return PollOptionDTO.builder()
                .id(option.getId())
                .pollId(option.getPollId())
                .optionText(option.getOptionText())
                .voteCount(option.getVoteCount() != null ? option.getVoteCount() : 0)
                .hasVoted(hasVoted)
                .createdAt(option.getCreatedAt())
                .updatedAt(option.getUpdatedAt())
                .build();
    }

    private PollVoteDTO convertToVoteDTO(PollVote vote) {
        return PollVoteDTO.builder()
                .id(vote.getId())
                .pollId(vote.getPollId())
                .pollOptionId(vote.getPollOptionId())
                .memberId(vote.getMemberId())
                .createdAt(vote.getCreatedAt())
                .build();
    }
}
