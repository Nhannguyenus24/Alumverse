package com.service.backend.forum.dao;

import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;

import com.service.backend.forum.entity.PollOption;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface PollOptionRepository extends R2dbcRepository<PollOption, Integer> {
    Flux<PollOption> findByPollId(Integer pollId);
    
    Mono<PollOption> findByPollIdAndId(Integer pollId, Integer id);
}
