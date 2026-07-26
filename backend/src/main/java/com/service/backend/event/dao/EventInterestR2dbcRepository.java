package com.service.backend.event.dao;

import com.service.backend.shared.entity.Event;
import com.service.backend.shared.entity.EventInterest;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Repository
public interface EventInterestR2dbcRepository extends R2dbcRepository<EventInterest, Long> {

    Mono<Boolean> existsByEventIdAndMemberId(Long eventId, Long memberId);

    Mono<Void> deleteByEventIdAndMemberId(Long eventId, Long memberId);

    @Query("SELECT * FROM event_interests WHERE event_id = :eventId ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<EventInterest> findByEventIdWithPagination(Long eventId, int limit, int offset);

    Mono<Long> countByEventId(Long eventId);

    @Query("SELECT e.* FROM events e JOIN event_interests i ON i.event_id = e.id " +
           "WHERE i.member_id = :memberId ORDER BY i.created_at DESC LIMIT :limit OFFSET :offset")
    Flux<Event> findInterestedEventsByMember(Long memberId, int limit, int offset);

    Mono<Long> countByMemberId(Long memberId);

    @Query("SELECT i.id AS interest_id, i.member_id AS member_id, e.id AS event_id, e.title AS event_title " +
           "FROM event_interests i JOIN events e ON e.id = i.event_id " +
           "WHERE e.registration_end_at > :now AND e.registration_end_at <= :windowEnd AND i.reminder_sent = false " +
           "AND NOT EXISTS (" +
           "  SELECT 1 FROM event_tickets t " +
           "  WHERE t.event_id = i.event_id AND t.member_id = i.member_id " +
           "    AND t.status IN ('ISSUED', 'ACTIVE', 'CHECKED_IN', 'USED')" +
           ")")
    Flux<EventReminderProjection> findPendingRegistrationReminders(LocalDateTime now, LocalDateTime windowEnd);

    @Query("UPDATE event_interests SET reminder_sent = true WHERE id = :id")
    Mono<Void> markReminderSent(Long id);

    interface EventReminderProjection {
        Long getInterestId();
        Long getMemberId();
        Long getEventId();
        String getEventTitle();
    }
}
