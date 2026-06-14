package com.service.backend.forum.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;

import com.service.backend.forum.dto.CreatePollRequest;
import com.service.backend.forum.dto.CreatePollVoteRequest;
import com.service.backend.forum.dto.PollDTO;
import com.service.backend.forum.dto.PollVoteDTO;
import com.service.backend.forum.service.PollService;
import com.service.backend.shared.dto.ApiResponse;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import reactor.core.publisher.Mono;
import org.springframework.web.server.ResponseStatusException;

@Tag(name = "Forum > Polls", description = "API endpoints for forum polls and voting")
@RestController
@RequestMapping("/api/forum/poll")
@Validated
public class PollController {
    private final PollService pollService;

    public PollController(PollService pollService) {
        this.pollService = pollService;
    }

    /**
     * Create a new poll with options
     */
    @PostMapping
    public Mono<ResponseEntity<ApiResponse<PollDTO>>> createPoll(
            @Valid @RequestBody CreatePollRequest request) {
        return pollService.createPoll(request)
                .map(poll -> ResponseEntity.status(HttpStatus.CREATED)
                        .body(new ApiResponse<>("Poll created successfully", poll)))
                .onErrorResume(this::handleError);
    }

    /**
     * Get poll by ID with vote information
     */
    @GetMapping("/{pollId}")
    public Mono<ResponseEntity<ApiResponse<PollDTO>>> getPollById(
            @PathVariable @Min(value = 1, message = "Poll ID must be greater than 0") Integer pollId,
            @Parameter(example = "1")
            @RequestParam(required = false) Integer memberId) {
        return pollService.getPollById(pollId, memberId)
                .map(poll -> ResponseEntity.ok(new ApiResponse<>("Poll retrieved successfully", poll)))
                .onErrorResume(this::handleError);
    }

    /**
     * Get all polls for a specific topic
     */
    @GetMapping("/topic/{topicId}")
    public Mono<ResponseEntity<ApiResponse<List<PollDTO>>>> getPollsByTopicId(
            @PathVariable @Min(value = 1, message = "Topic ID must be greater than 0") Integer topicId,
            @Parameter(example = "1")
            @RequestParam(required = false) Integer memberId) {
        return pollService.getPollsByTopicId(topicId, memberId)
                .collectList()
                .map(polls -> ResponseEntity.ok(new ApiResponse<>("Polls retrieved successfully", polls)))
                .onErrorResume(this::handleError);
    }

    /**
     * Vote on a poll option
     * Each member can only vote once per poll
     */
    @PostMapping("/vote")
    public Mono<ResponseEntity<ApiResponse<PollVoteDTO>>> voteOnPoll(
            @Valid @RequestBody CreatePollVoteRequest request) {
        return pollService.voteOnPoll(request)
                .map(vote -> ResponseEntity.status(HttpStatus.CREATED)
                        .body(new ApiResponse<>("Vote recorded successfully", vote)))
                .onErrorResume(error -> {
                    if (error.getMessage() != null && 
                        (error.getMessage().contains("already voted") || 
                         error.getMessage().contains("Poll not found") ||
                         error.getMessage().contains("Poll option not found"))) {
                        return Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body(new ApiResponse<>(error.getMessage(), null)));
                    }
                    return handleError(error);
                });
    }

    /**
     * Change/remove vote (member can change their vote by voting again)
     */
    @DeleteMapping("/vote/{pollId}")
    public Mono<ResponseEntity<ApiResponse<Object>>> removeVote(
            @PathVariable @Min(value = 1, message = "Poll ID must be greater than 0") Integer pollId,
            @Parameter(example = "1")
            @RequestParam @NotNull(message = "Member ID is required") Integer memberId) {
        return pollService.removeVote(pollId, memberId)
                .then(Mono.just(ResponseEntity.ok(
                        new ApiResponse<>("Vote removed successfully", null))))
                .onErrorResume(this::handleError);
    }

    /**
     * Close a poll (stop accepting votes)
     */
    @PutMapping("/{pollId}/close")
    public Mono<ResponseEntity<ApiResponse<PollDTO>>> closePoll(
            @PathVariable @Min(value = 1, message = "Poll ID must be greater than 0") Integer pollId) {
        return pollService.closePoll(pollId)
                .map(poll -> ResponseEntity.ok(new ApiResponse<>("Poll closed successfully", poll)))
                .onErrorResume(this::handleError);
    }

    /**
     * Delete a poll
     */
    @DeleteMapping("/{pollId}")
    public Mono<ResponseEntity<ApiResponse<Object>>> deletePoll(
            @PathVariable @Min(value = 1, message = "Poll ID must be greater than 0") Integer pollId) {
        return pollService.deletePoll(pollId)
                .then(Mono.just(ResponseEntity.ok(
                        new ApiResponse<>("Poll deleted successfully", null))))
                .onErrorResume(this::handleError);
    }

    private <T> Mono<ResponseEntity<ApiResponse<T>>> handleError(Throwable error) {
        HttpStatus status = resolveHttpStatus(error);
        return Mono.just(ResponseEntity.status(status)
                .body(new ApiResponse<>(error.getMessage(), null)));
    }

    private HttpStatus resolveHttpStatus(Throwable error) {
        if (error instanceof ResponseStatusException responseStatusException) {
            return HttpStatus.valueOf(responseStatusException.getStatusCode().value());
        }

        String message = error.getMessage();
        if (message == null) {
            return HttpStatus.INTERNAL_SERVER_ERROR;
        }

        if (message.contains("not found")) {
            return HttpStatus.NOT_FOUND;
        }
        if (message.contains("already voted")) {
            return HttpStatus.BAD_REQUEST;
        }

        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
}
