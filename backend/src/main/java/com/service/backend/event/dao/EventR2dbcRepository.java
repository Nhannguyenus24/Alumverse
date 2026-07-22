package com.service.backend.event.dao;

import com.service.backend.shared.entity.Event;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.service.backend.admin.dto.EventStatisticsDTO;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Repository
public interface EventR2dbcRepository extends R2dbcRepository<Event, Long> {

    @Query("SELECT * FROM events WHERE organization_id = :organizationId ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<Event> findByOrganizationIdWithPagination(Long organizationId, int limit, int offset);

    @Query("SELECT COUNT(*) FROM events WHERE organization_id = :organizationId")
    Mono<Long> countByOrganizationId(Long organizationId);

    @Query("SELECT * FROM events WHERE organization_id = :organizationId AND start_time > :now AND is_published = true ORDER BY start_time ASC LIMIT :limit OFFSET :offset")
    Flux<Event> findUpcomingEvents(Long organizationId, LocalDateTime now, int limit, int offset);

    @Query("SELECT COUNT(*) FROM events WHERE organization_id = :organizationId AND start_time > :now AND is_published = true")
    Mono<Long> countUpcomingEvents(Long organizationId, LocalDateTime now);

    @Query("SELECT * FROM events WHERE start_time > :now AND is_published = true ORDER BY start_time ASC LIMIT :limit OFFSET :offset")
    Flux<Event> findAllUpcomingEvents(LocalDateTime now, int limit, int offset);

    @Query("SELECT COUNT(*) FROM events WHERE start_time > :now AND is_published = true")
    Mono<Long> countAllUpcomingEvents(LocalDateTime now);

    @Query("SELECT * FROM events WHERE organization_id = :organizationId AND end_time < :now AND is_published = true ORDER BY end_time DESC LIMIT :limit OFFSET :offset")
    Flux<Event> findPastEvents(Long organizationId, LocalDateTime now, int limit, int offset);

    @Query("SELECT COUNT(*) FROM events WHERE organization_id = :organizationId AND end_time < :now AND is_published = true")
    Mono<Long> countPastEvents(Long organizationId, LocalDateTime now);

    @Query("SELECT * FROM events WHERE organization_id = :organizationId AND (LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(description) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND is_published = true ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<Event> searchEvents(Long organizationId, String keyword, int limit, int offset);

    @Query("SELECT COUNT(*) FROM events WHERE organization_id = :organizationId AND (LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(description) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND is_published = true")
    Mono<Long> countSearchEvents(Long organizationId, String keyword);

    @Modifying
    @Query("UPDATE events SET is_published = true, updated_at = CURRENT_TIMESTAMP WHERE id = :eventId")
    Mono<Integer> publishEvent(Long eventId);

    @Modifying
    @Query("UPDATE events SET is_published = false, updated_at = CURRENT_TIMESTAMP WHERE id = :eventId")
    Mono<Integer> unpublishEvent(Long eventId);

    @Modifying
    @Query("UPDATE events SET interested_count = interested_count + 1 WHERE id = :eventId")
    Mono<Integer> incrementInterestedCount(Long eventId);

    @Modifying
    @Query("UPDATE events SET interested_count = GREATEST(interested_count - 1, 0) WHERE id = :eventId")
    Mono<Integer> decrementInterestedCount(Long eventId);

    @Query("SELECT * FROM events ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<Event> findAllEventsWithPagination(@Param("limit") int limit, @Param("offset") int offset);

    @Query("SELECT COUNT(*) FROM events")
    Mono<Long> countAllEvents();

    @Query("SELECT * FROM events WHERE organization_id = :organizationId ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<Event> findEventsByOrganization(@Param("organizationId") Long organizationId,
                                         @Param("limit") int limit,
                                         @Param("offset") int offset);

    @Query("SELECT COUNT(*) FROM events WHERE organization_id = :organizationId")
    Mono<Long> countEventsByOrganization(@Param("organizationId") Long organizationId);

    @Query("SELECT * FROM events " +
           "WHERE LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "   OR LOWER(description) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<Event> searchAllEvents(@Param("keyword") String keyword,
                                @Param("limit") int limit,
                                @Param("offset") int offset);

    @Query("SELECT COUNT(*) FROM events " +
           "WHERE LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "   OR LOWER(description) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Mono<Long> countSearchAllEvents(@Param("keyword") String keyword);

    @Query("SELECT * FROM events WHERE is_published = :isPublished ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<Event> findEventsByPublishStatus(@Param("isPublished") Boolean isPublished,
                                          @Param("limit") int limit,
                                          @Param("offset") int offset);

    @Query("SELECT COUNT(*) FROM events WHERE is_published = :isPublished")
    Mono<Long> countEventsByPublishStatus(@Param("isPublished") Boolean isPublished);

    @Query("SELECT COUNT(*) FROM events WHERE start_time > :now")
    Mono<Long> countUpcomingEvents(@Param("now") LocalDateTime now);

    @Query("SELECT COUNT(*) FROM event_tickets")
    Mono<Long> countAllTickets();

    @Query("SELECT COUNT(*) FROM event_interests")
    Mono<Long> countAllInterests();

    @Query("WITH ticket_counts AS (" +
           "  SELECT event_id, COUNT(id) as registered_count " +
           "  FROM event_tickets " +
           "  WHERE status IN ('ISSUED', 'ACTIVE', 'USED', 'CHECKED_IN') " +
           "  GROUP BY event_id" +
           ") " +
           "SELECT e.id as event_id, e.organization_id as organization_id, e.title as title, e.location as location, e.start_time as start_time, e.end_time as end_time, e.interested_count as interested_count, e.is_published as is_published, " +
           "COALESCE(t.registered_count, 0) as registered_count " +
           "FROM events e " +
           "LEFT JOIN ticket_counts t ON e.id = t.event_id " +
           "ORDER BY registered_count DESC, e.created_at DESC " +
           "LIMIT :limit")
    Flux<EventStatisticsDTO.EventSummary> findTopEventsByRegistrationSummary(@Param("limit") int limit);

    @Query("SELECT e.id as event_id, e.organization_id as organization_id, e.title as title, e.location as location, e.start_time as start_time, e.end_time as end_time, e.interested_count as interested_count, e.is_published as is_published, " +
           "(SELECT COUNT(t.id) FROM event_tickets t WHERE t.event_id = e.id AND t.status IN ('ISSUED', 'ACTIVE', 'USED', 'CHECKED_IN')) as registered_count " +
           "FROM events e ORDER BY e.interested_count DESC, e.created_at DESC LIMIT :limit")
    Flux<EventStatisticsDTO.EventSummary> findTopEventsByInterestSummary(@Param("limit") int limit);

    @Query("SELECT * FROM events WHERE organization_id = :organizationId " +
           "AND (LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "   OR LOWER(description) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<Event> searchEventsByOrganization(@Param("organizationId") Long organizationId,
                                           @Param("keyword") String keyword,
                                           @Param("limit") int limit,
                                           @Param("offset") int offset);

    @Query("SELECT COUNT(*) FROM events WHERE organization_id = :organizationId " +
           "AND (LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "   OR LOWER(description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Mono<Long> countSearchEventsByOrganization(@Param("organizationId") Long organizationId,
                                               @Param("keyword") String keyword);

    @Query("SELECT * FROM events WHERE organization_id = :organizationId AND is_published = :isPublished " +
           "ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<Event> findEventsByOrganizationAndPublishStatus(@Param("organizationId") Long organizationId,
                                                         @Param("isPublished") Boolean isPublished,
                                                         @Param("limit") int limit,
                                                         @Param("offset") int offset);

    @Query("SELECT COUNT(*) FROM events WHERE organization_id = :organizationId AND is_published = :isPublished")
    Mono<Long> countEventsByOrganizationAndPublishStatus(@Param("organizationId") Long organizationId,
                                                          @Param("isPublished") Boolean isPublished);

    @Query("""
        SELECT
            COUNT(*) AS total_events,
            SUM(CASE WHEN is_published = true THEN 1 ELSE 0 END) AS published_events,
            SUM(CASE WHEN is_published = false THEN 1 ELSE 0 END) AS unpublished_events,
            SUM(CASE WHEN start_time > :now THEN 1 ELSE 0 END) AS upcoming_events,
            SUM(CASE WHEN start_time <= :now AND end_time >= :now THEN 1 ELSE 0 END) AS ongoing_events,
            SUM(CASE WHEN end_time < :now THEN 1 ELSE 0 END) AS past_events,
            SUM(CASE WHEN created_at >= :startOfDay AND created_at < :endOfDay THEN 1 ELSE 0 END) AS new_events_today
        FROM events
    """)
    Mono<com.service.backend.admin.dto.EventAggregatedStatsProjection> getAggregatedEventStats(
            @Param("now") LocalDateTime now,
            @Param("startOfDay") LocalDateTime startOfDay,
            @Param("endOfDay") LocalDateTime endOfDay
    );

    @Query("""
        SELECT
            COUNT(*) AS total_tickets,
            SUM(CASE WHEN status IN ('ISSUED', 'ACTIVE', 'REGISTERED') THEN 1 ELSE 0 END) AS registered_tickets,
            SUM(CASE WHEN status IN ('USED', 'CHECKED_IN') THEN 1 ELSE 0 END) AS checked_in_tickets,
            SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled_tickets
        FROM event_tickets
    """)
    Mono<com.service.backend.admin.dto.EventTicketAggregatedStatsProjection> getAggregatedTicketStats();
}
