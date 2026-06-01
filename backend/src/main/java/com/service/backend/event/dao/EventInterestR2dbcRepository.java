package com.service.backend.event.dao;

import com.service.backend.event.entity.EventInterest;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface EventInterestR2dbcRepository extends ReactiveCrudRepository<EventInterest, Long> {

    Mono<EventInterest> findByEventIdAndMemberId(Long eventId, Long memberId);

    Mono<Boolean> existsByEventIdAndMemberId(Long eventId, Long memberId);

    Mono<Void> deleteByEventIdAndMemberId(Long eventId, Long memberId);

    @Query("SELECT * FROM event_interests WHERE event_id = :eventId ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<EventInterest> findByEventIdWithPagination(Long eventId, int limit, int offset);

    Mono<Long> countByEventId(Long eventId);
}
