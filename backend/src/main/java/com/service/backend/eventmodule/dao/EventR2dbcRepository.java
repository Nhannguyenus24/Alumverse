package com.service.backend.eventmodule.dao;

import com.service.backend.eventmodule.domain.entity.Event;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Repository
public interface EventR2dbcRepository extends ReactiveCrudRepository<Event, Long> {

    Flux<Event> findByOrganizationIdOrderByCreatedAtDesc(Long organizationId);

    @Query("SELECT * FROM events WHERE organization_id = :organizationId ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<Event> findByOrganizationIdWithPagination(Long organizationId, int limit, int offset);

    @Query("SELECT COUNT(*) FROM events WHERE organization_id = :organizationId")
    Mono<Long> countByOrganizationId(Long organizationId);

    @Query("SELECT * FROM events WHERE organization_id = :organizationId AND start_time > :now AND is_published = true ORDER BY start_time ASC LIMIT :limit OFFSET :offset")
    Flux<Event> findUpcomingEvents(Long organizationId, LocalDateTime now, int limit, int offset);

    @Query("SELECT COUNT(*) FROM events WHERE organization_id = :organizationId AND start_time > :now AND is_published = true")
    Mono<Long> countUpcomingEvents(Long organizationId, LocalDateTime now);

    @Query("SELECT * FROM events WHERE organization_id = :organizationId AND end_time < :now AND is_published = true ORDER BY end_time DESC LIMIT :limit OFFSET :offset")
    Flux<Event> findPastEvents(Long organizationId, LocalDateTime now, int limit, int offset);

    @Query("SELECT COUNT(*) FROM events WHERE organization_id = :organizationId AND end_time < :now AND is_published = true")
    Mono<Long> countPastEvents(Long organizationId, LocalDateTime now);

    @Query("SELECT * FROM events WHERE organization_id = :organizationId AND (LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(description) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND is_published = true ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<Event> searchEvents(Long organizationId, String keyword, int limit, int offset);

    @Query("SELECT COUNT(*) FROM events WHERE organization_id = :organizationId AND (LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(description) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND is_published = true")
    Mono<Long> countSearchEvents(Long organizationId, String keyword);

    @Modifying
    @Query("UPDATE events SET is_published = true WHERE id = :eventId")
    Mono<Integer> publishEvent(Long eventId);

    @Modifying
    @Query("UPDATE events SET is_published = false WHERE id = :eventId")
    Mono<Integer> unpublishEvent(Long eventId);

    @Modifying
    @Query("UPDATE events SET interested_count = interested_count + 1 WHERE id = :eventId")
    Mono<Integer> incrementInterestedCount(Long eventId);

    @Modifying
    @Query("UPDATE events SET interested_count = GREATEST(interested_count - 1, 0) WHERE id = :eventId")
    Mono<Integer> decrementInterestedCount(Long eventId);
}
