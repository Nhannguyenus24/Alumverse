package com.service.backend.forum.dao;

import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;

import com.service.backend.shared.entity.PollOption;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface PollOptionRepository extends R2dbcRepository<PollOption, Integer> {
    Flux<PollOption> findByPollId(Integer pollId);

    Mono<PollOption> findByPollIdAndId(Integer pollId, Integer id);

    @Modifying
    @Query("UPDATE poll_options SET vote_count = vote_count + 1, updated_at = NOW() WHERE id = :id")
    Mono<Void> incrementVoteCount(Integer id);

    @Modifying
    @Query("UPDATE poll_options SET vote_count = GREATEST(0, vote_count - 1), updated_at = NOW() WHERE id = :id")
    Mono<Void> decrementVoteCount(Integer id);
}
