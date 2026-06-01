package com.service.backend.forum.dao;

import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;

import com.service.backend.shared.entity.PollVote;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface PollVoteRepository extends R2dbcRepository<PollVote, Integer> {
    Mono<PollVote> findByPollIdAndMemberId(Integer pollId, Integer memberId);
    
    Mono<PollVote> findByPollIdAndPollOptionIdAndMemberId(Integer pollId, Integer pollOptionId, Integer memberId);
    
    Flux<PollVote> findByPollId(Integer pollId);
    
    Flux<PollVote> findByPollOptionId(Integer pollOptionId);
    
    Mono<Long> countByPollOptionId(Integer pollOptionId);
}
