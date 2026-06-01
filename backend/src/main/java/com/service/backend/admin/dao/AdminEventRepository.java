package com.service.backend.admin.dao;

import com.service.backend.shared.entity.Event;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Repository
public interface AdminEventRepository extends R2dbcRepository<Event, Long> {

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

    @Query("SELECT COUNT(*) FROM events WHERE is_published = true")
    Mono<Long> countPublishedEvents();

    @Query("SELECT COUNT(*) FROM events WHERE is_published = false")
    Mono<Long> countUnpublishedEvents();

    @Query("SELECT COUNT(*) FROM events WHERE start_time > :now")
    Mono<Long> countUpcomingEvents(@Param("now") LocalDateTime now);

    @Query("SELECT COUNT(*) FROM events WHERE end_time < :now")
    Mono<Long> countPastEvents(@Param("now") LocalDateTime now);

    @Query("SELECT COUNT(*) FROM events WHERE start_time <= :now AND end_time >= :now")
    Mono<Long> countOngoingEvents(@Param("now") LocalDateTime now);

    @Query("SELECT COUNT(*) FROM events WHERE created_at >= :startOfDay AND created_at < :endOfDay")
    Mono<Long> countEventsCreatedToday(@Param("startOfDay") LocalDateTime startOfDay,
                                       @Param("endOfDay") LocalDateTime endOfDay);

    @Query("SELECT COUNT(*) FROM event_tickets")
    Mono<Long> countAllTickets();

    @Query("SELECT COUNT(*) FROM event_tickets WHERE status = :status")
    Mono<Long> countTicketsByStatus(@Param("status") String status);

    @Query("SELECT COUNT(*) FROM event_interests")
    Mono<Long> countAllInterests();

    @Query("SELECT e.* FROM events e " +
           "LEFT JOIN event_tickets t ON t.event_id = e.id AND t.status IN ('REGISTERED', 'CHECKED_IN') " +
           "GROUP BY e.id " +
           "ORDER BY COUNT(t.id) DESC, e.created_at DESC " +
           "LIMIT :limit")
    Flux<Event> findTopEventsByRegistration(@Param("limit") int limit);

    @Query("SELECT * FROM events ORDER BY interested_count DESC, created_at DESC LIMIT :limit")
    Flux<Event> findTopEventsByInterest(@Param("limit") int limit);
}
