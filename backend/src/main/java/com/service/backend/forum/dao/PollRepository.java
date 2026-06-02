package com.service.backend.forum.dao;

import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;

import com.service.backend.shared.entity.Poll;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface PollRepository extends R2dbcRepository<Poll, Integer> {
    Flux<Poll> findByTopicId(Integer topicId);
    
    Flux<Poll> findByOrganizationId(Integer organizationId);
    
    Mono<Poll> findByIdAndOrganizationId(Integer id, Integer organizationId);
}
