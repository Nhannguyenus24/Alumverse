package com.service.backend.admin.dao;

import com.service.backend.admin.dto.EventStatisticsDTO;
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

    @Query("SELECT e.id as event_id, e.organization_id as organization_id, e.title as title, e.location as location, e.start_time as start_time, e.end_time as end_time, e.interested_count as interested_count, e.is_published as is_published, " +
           "COUNT(t.id) as registered_count " +
           "FROM events e " +
           "LEFT JOIN event_tickets t ON t.event_id = e.id AND t.status IN ('REGISTERED', 'CHECKED_IN') " +
           "GROUP BY e.id " +
           "ORDER BY registered_count DESC, e.created_at DESC " +
           "LIMIT :limit")
    Flux<EventStatisticsDTO.EventSummary> findTopEventsByRegistrationSummary(@Param("limit") int limit);

    @Query("SELECT e.id as event_id, e.organization_id as organization_id, e.title as title, e.location as location, e.start_time as start_time, e.end_time as end_time, e.interested_count as interested_count, e.is_published as is_published, " +
           "(SELECT COUNT(t.id) FROM event_tickets t WHERE t.event_id = e.id AND t.status IN ('REGISTERED', 'CHECKED_IN')) as registered_count " +
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
}
