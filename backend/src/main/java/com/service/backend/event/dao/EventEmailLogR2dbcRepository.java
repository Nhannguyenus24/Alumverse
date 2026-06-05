package com.service.backend.event.dao;

import com.service.backend.shared.entity.EventEmailLog;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface EventEmailLogR2dbcRepository extends ReactiveCrudRepository<EventEmailLog, Long> {

    @Query("SELECT * FROM event_email_logs WHERE event_id = :eventId ORDER BY sent_at DESC LIMIT :limit OFFSET :offset")
    Flux<EventEmailLog> findByEventIdWithPagination(Long eventId, int limit, int offset);

    Mono<Long> countByEventId(Long eventId);
}
