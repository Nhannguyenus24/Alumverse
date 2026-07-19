package com.service.backend.event.dao;

import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.service.backend.shared.entity.EventComment;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface EventCommentRepository extends R2dbcRepository<EventComment, Integer> {

    @Query("SELECT * FROM event_comments WHERE event_id = :eventId AND is_hidden = false ORDER BY created_at ASC LIMIT :limit OFFSET :offset")
    Flux<EventComment> findByEventIdWithPagination(
            @Param("eventId") Long eventId,
            @Param("limit") int limit,
            @Param("offset") long offset
    );

    @Query("SELECT COUNT(*) FROM event_comments WHERE event_id = :eventId AND is_hidden = false")
    Mono<Long> countByEventId(@Param("eventId") Long eventId);

    @Query("DELETE FROM event_comments WHERE event_id = :eventId")
    Mono<Void> deleteByEventId(@Param("eventId") Long eventId);
}
