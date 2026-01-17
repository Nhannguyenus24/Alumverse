package com.service.backend.eventmodule.dao;

import com.service.backend.eventmodule.domain.entity.Event;
import com.service.backend.eventmodule.domain.entity.EventInterest;
import com.service.backend.eventmodule.domain.entity.EventTicket;
import com.service.backend.eventmodule.domain.repository.IEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class EventRepository implements IEventRepository {

    private final DatabaseClient databaseClient;

    @Override
    public Mono<Event> createEvent(Event eventData) {
        eventData.setCreatedAt(LocalDateTime.now());
        eventData.setIsPublished(false);
        eventData.setInterestedCount(0);

        return databaseClient.sql("""
                INSERT INTO events (organization_id, creator_member_id, title, description, banner_url,
                    location, start_time, end_time, registration_start_at, registration_end_at,
                    max_capacity, interested_count, is_published, created_at)
                VALUES (:organizationId, :creatorMemberId, :title, :description, :bannerUrl,
                    :location, :startTime, :endTime, :registrationStartAt, :registrationEndAt,
                    :maxCapacity, :interestedCount, :isPublished, :createdAt)
                """)
                .bind("organizationId", eventData.getOrganizationId())
                .bind("creatorMemberId", eventData.getCreatorMemberId())
                .bind("title", eventData.getTitle())
                .bind("description", eventData.getDescription() != null ? eventData.getDescription() : "")
                .bind("bannerUrl", eventData.getBannerUrl() != null ? eventData.getBannerUrl() : "")
                .bind("location", eventData.getLocation() != null ? eventData.getLocation() : "")
                .bind("startTime", eventData.getStartTime())
                .bind("endTime", eventData.getEndTime())
                .bind("registrationStartAt", eventData.getRegistrationStartAt())
                .bind("registrationEndAt", eventData.getRegistrationEndAt())
                .bind("maxCapacity", eventData.getMaxCapacity() != null ? eventData.getMaxCapacity() : 0)
                .bind("interestedCount", eventData.getInterestedCount())
                .bind("isPublished", eventData.getIsPublished())
                .bind("createdAt", eventData.getCreatedAt())
                .filter((statement, next) -> statement.returnGeneratedValues("id").execute())
                .fetch()
                .first()
                .map(result -> {
                    eventData.setId(((Number) result.get("id")).longValue());
                    return eventData;
                });
    }

    @Override
    public Mono<Event> updateEvent(Long eventId, Event eventData) {
        return databaseClient.sql("""
                UPDATE events SET
                    title = :title,
                    description = :description,
                    banner_url = :bannerUrl,
                    location = :location,
                    start_time = :startTime,
                    end_time = :endTime,
                    registration_start_at = :registrationStartAt,
                    registration_end_at = :registrationEndAt,
                    max_capacity = :maxCapacity
                WHERE id = :eventId
                """)
                .bind("eventId", eventId)
                .bind("title", eventData.getTitle())
                .bind("description", eventData.getDescription() != null ? eventData.getDescription() : "")
                .bind("bannerUrl", eventData.getBannerUrl() != null ? eventData.getBannerUrl() : "")
                .bind("location", eventData.getLocation() != null ? eventData.getLocation() : "")
                .bind("startTime", eventData.getStartTime())
                .bind("endTime", eventData.getEndTime())
                .bind("registrationStartAt", eventData.getRegistrationStartAt())
                .bind("registrationEndAt", eventData.getRegistrationEndAt())
                .bind("maxCapacity", eventData.getMaxCapacity() != null ? eventData.getMaxCapacity() : 0)
                .fetch()
                .rowsUpdated()
                .flatMap(rows -> findEventById(eventId));
    }

    @Override
    public Mono<Boolean> deleteEvent(Long eventId) {
        return databaseClient.sql("DELETE FROM events WHERE id = :eventId")
                .bind("eventId", eventId)
                .fetch()
                .rowsUpdated()
                .map(rows -> rows > 0);
    }

    @Override
    public Mono<Event> findEventById(Long eventId) {
        return databaseClient.sql("SELECT * FROM events WHERE id = :eventId")
                .bind("eventId", eventId)
                .map((row, metadata) -> Event.builder()
                        .id(row.get("id", Long.class))
                        .organizationId(row.get("organization_id", Long.class))
                        .creatorMemberId(row.get("creator_member_id", Long.class))
                        .title(row.get("title", String.class))
                        .description(row.get("description", String.class))
                        .bannerUrl(row.get("banner_url", String.class))
                        .location(row.get("location", String.class))
                        .startTime(row.get("start_time", LocalDateTime.class))
                        .endTime(row.get("end_time", LocalDateTime.class))
                        .registrationStartAt(row.get("registration_start_at", LocalDateTime.class))
                        .registrationEndAt(row.get("registration_end_at", LocalDateTime.class))
                        .maxCapacity(row.get("max_capacity", Integer.class))
                        .interestedCount(row.get("interested_count", Integer.class))
                        .isPublished(row.get("is_published", Boolean.class))
                        .createdAt(row.get("created_at", LocalDateTime.class))
                        .build())
                .first();
    }

    @Override
    public Mono<Map<String, Object>> findEventsByOrganization(Long organizationId, int page, int limit, Map<String, Object> filters) {
        int offset = page * limit;

        return databaseClient.sql("""
                SELECT * FROM events
                WHERE organization_id = :organizationId
                ORDER BY created_at DESC
                LIMIT :limit OFFSET :offset
                """)
                .bind("organizationId", organizationId)
                .bind("limit", limit)
                .bind("offset", offset)
                .map((row, metadata) -> Event.builder()
                        .id(row.get("id", Long.class))
                        .organizationId(row.get("organization_id", Long.class))
                        .creatorMemberId(row.get("creator_member_id", Long.class))
                        .title(row.get("title", String.class))
                        .description(row.get("description", String.class))
                        .bannerUrl(row.get("banner_url", String.class))
                        .location(row.get("location", String.class))
                        .startTime(row.get("start_time", LocalDateTime.class))
                        .endTime(row.get("end_time", LocalDateTime.class))
                        .registrationStartAt(row.get("registration_start_at", LocalDateTime.class))
                        .registrationEndAt(row.get("registration_end_at", LocalDateTime.class))
                        .maxCapacity(row.get("max_capacity", Integer.class))
                        .interestedCount(row.get("interested_count", Integer.class))
                        .isPublished(row.get("is_published", Boolean.class))
                        .createdAt(row.get("created_at", LocalDateTime.class))
                        .build())
                .all()
                .collectList()
                .zipWith(databaseClient.sql("SELECT COUNT(*) as total FROM events WHERE organization_id = :organizationId")
                        .bind("organizationId", organizationId)
                        .map((row, metadata) -> row.get("total", Long.class))
                        .first())
                .map(tuple -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("events", tuple.getT1());
                    result.put("total", tuple.getT2());
                    result.put("page", page);
                    result.put("limit", limit);
                    return result;
                });
    }

    @Override
    public Mono<Event> publishEvent(Long eventId) {
        return databaseClient.sql("UPDATE events SET is_published = true WHERE id = :eventId")
                .bind("eventId", eventId)
                .fetch()
                .rowsUpdated()
                .flatMap(rows -> findEventById(eventId));
    }

    @Override
    public Mono<Event> unpublishEvent(Long eventId) {
        return databaseClient.sql("UPDATE events SET is_published = false WHERE id = :eventId")
                .bind("eventId", eventId)
                .fetch()
                .rowsUpdated()
                .flatMap(rows -> findEventById(eventId));
    }

    @Override
    public Mono<Map<String, Object>> findUpcomingEvents(Long organizationId, int page, int limit) {
        int offset = page * limit;
        LocalDateTime now = LocalDateTime.now();

        return databaseClient.sql("""
                SELECT * FROM events
                WHERE organization_id = :organizationId
                AND start_time > :now
                AND is_published = true
                ORDER BY start_time ASC
                LIMIT :limit OFFSET :offset
                """)
                .bind("organizationId", organizationId)
                .bind("now", now)
                .bind("limit", limit)
                .bind("offset", offset)
                .map((row, metadata) -> mapRowToEvent(row))
                .all()
                .collectList()
                .zipWith(databaseClient.sql("""
                        SELECT COUNT(*) as total FROM events
                        WHERE organization_id = :organizationId
                        AND start_time > :now
                        AND is_published = true
                        """)
                        .bind("organizationId", organizationId)
                        .bind("now", now)
                        .map((row, metadata) -> row.get("total", Long.class))
                        .first())
                .map(tuple -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("events", tuple.getT1());
                    result.put("total", tuple.getT2());
                    result.put("page", page);
                    result.put("limit", limit);
                    return result;
                });
    }

    @Override
    public Mono<Map<String, Object>> findPastEvents(Long organizationId, int page, int limit) {
        int offset = page * limit;
        LocalDateTime now = LocalDateTime.now();

        return databaseClient.sql("""
                SELECT * FROM events
                WHERE organization_id = :organizationId
                AND end_time < :now
                AND is_published = true
                ORDER BY end_time DESC
                LIMIT :limit OFFSET :offset
                """)
                .bind("organizationId", organizationId)
                .bind("now", now)
                .bind("limit", limit)
                .bind("offset", offset)
                .map((row, metadata) -> mapRowToEvent(row))
                .all()
                .collectList()
                .zipWith(databaseClient.sql("""
                        SELECT COUNT(*) as total FROM events
                        WHERE organization_id = :organizationId
                        AND end_time < :now
                        AND is_published = true
                        """)
                        .bind("organizationId", organizationId)
                        .bind("now", now)
                        .map((row, metadata) -> row.get("total", Long.class))
                        .first())
                .map(tuple -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("events", tuple.getT1());
                    result.put("total", tuple.getT2());
                    result.put("page", page);
                    result.put("limit", limit);
                    return result;
                });
    }

    @Override
    public Mono<Map<String, Object>> searchEvents(Long organizationId, String keyword, int page, int limit) {
        int offset = page * limit;
        String searchPattern = "%" + keyword.toLowerCase() + "%";

        return databaseClient.sql("""
                SELECT * FROM events
                WHERE organization_id = :organizationId
                AND (LOWER(title) LIKE :keyword OR LOWER(description) LIKE :keyword)
                AND is_published = true
                ORDER BY created_at DESC
                LIMIT :limit OFFSET :offset
                """)
                .bind("organizationId", organizationId)
                .bind("keyword", searchPattern)
                .bind("limit", limit)
                .bind("offset", offset)
                .map((row, metadata) -> mapRowToEvent(row))
                .all()
                .collectList()
                .zipWith(databaseClient.sql("""
                        SELECT COUNT(*) as total FROM events
                        WHERE organization_id = :organizationId
                        AND (LOWER(title) LIKE :keyword OR LOWER(description) LIKE :keyword)
                        AND is_published = true
                        """)
                        .bind("organizationId", organizationId)
                        .bind("keyword", searchPattern)
                        .map((row, metadata) -> row.get("total", Long.class))
                        .first())
                .map(tuple -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("events", tuple.getT1());
                    result.put("total", tuple.getT2());
                    result.put("page", page);
                    result.put("limit", limit);
                    return result;
                });
    }

    @Override
    public Mono<EventInterest> addEventInterest(Long eventId, Long memberId) {
        LocalDateTime now = LocalDateTime.now();

        return databaseClient.sql("""
                INSERT INTO event_interests (event_id, member_id, created_at)
                VALUES (:eventId, :memberId, :createdAt)
                """)
                .bind("eventId", eventId)
                .bind("memberId", memberId)
                .bind("createdAt", now)
                .filter((statement, next) -> statement.returnGeneratedValues("id").execute())
                .fetch()
                .first()
                .map(result -> EventInterest.builder()
                        .id(((Number) result.get("id")).longValue())
                        .eventId(eventId)
                        .memberId(memberId)
                        .createdAt(now)
                        .build())
                .flatMap(interest -> updateInterestedCount(eventId, true).thenReturn(interest));
    }

    @Override
    public Mono<Boolean> removeEventInterest(Long eventId, Long memberId) {
        return databaseClient.sql("DELETE FROM event_interests WHERE event_id = :eventId AND member_id = :memberId")
                .bind("eventId", eventId)
                .bind("memberId", memberId)
                .fetch()
                .rowsUpdated()
                .flatMap(rows -> {
                    if (rows > 0) {
                        return updateInterestedCount(eventId, false).thenReturn(true);
                    }
                    return Mono.just(false);
                });
    }

    @Override
    public Mono<Map<String, Object>> findEventInterests(Long eventId, int page, int limit) {
        int offset = page * limit;

        return databaseClient.sql("""
                SELECT * FROM event_interests
                WHERE event_id = :eventId
                ORDER BY created_at DESC
                LIMIT :limit OFFSET :offset
                """)
                .bind("eventId", eventId)
                .bind("limit", limit)
                .bind("offset", offset)
                .map((row, metadata) -> EventInterest.builder()
                        .id(row.get("id", Long.class))
                        .eventId(row.get("event_id", Long.class))
                        .memberId(row.get("member_id", Long.class))
                        .createdAt(row.get("created_at", LocalDateTime.class))
                        .build())
                .all()
                .collectList()
                .zipWith(databaseClient.sql("SELECT COUNT(*) as total FROM event_interests WHERE event_id = :eventId")
                        .bind("eventId", eventId)
                        .map((row, metadata) -> row.get("total", Long.class))
                        .first())
                .map(tuple -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("interests", tuple.getT1());
                    result.put("total", tuple.getT2());
                    result.put("page", page);
                    result.put("limit", limit);
                    return result;
                });
    }

    @Override
    public Mono<Boolean> checkUserInterest(Long eventId, Long memberId) {
        return databaseClient.sql("SELECT COUNT(*) as count FROM event_interests WHERE event_id = :eventId AND member_id = :memberId")
                .bind("eventId", eventId)
                .bind("memberId", memberId)
                .map((row, metadata) -> row.get("count", Long.class))
                .first()
                .map(count -> count > 0);
    }

    @Override
    public Mono<Event> updateInterestedCount(Long eventId, Boolean increment) {
        String sql = increment
                ? "UPDATE events SET interested_count = interested_count + 1 WHERE id = :eventId"
                : "UPDATE events SET interested_count = GREATEST(interested_count - 1, 0) WHERE id = :eventId";

        return databaseClient.sql(sql)
                .bind("eventId", eventId)
                .fetch()
                .rowsUpdated()
                .flatMap(rows -> findEventById(eventId));
    }

    @Override
    public Mono<EventTicket> registerTicket(EventTicket ticketData) {
        ticketData.setTicketCode(UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        ticketData.setStatus("REGISTERED");
        ticketData.setRegisteredAt(LocalDateTime.now());

        return databaseClient.sql("""
                INSERT INTO event_tickets (event_id, member_id, guest_name, guest_email, guest_phone, ticket_code, status, registered_at)
                VALUES (:eventId, :memberId, :guestName, :guestEmail, :guestPhone, :ticketCode, :status, :registeredAt)
                """)
                .bind("eventId", ticketData.getEventId())
                .bind("memberId", ticketData.getMemberId())
                .bind("guestName", ticketData.getGuestName() != null ? ticketData.getGuestName() : "")
                .bind("guestEmail", ticketData.getGuestEmail() != null ? ticketData.getGuestEmail() : "")
                .bind("guestPhone", ticketData.getGuestPhone() != null ? ticketData.getGuestPhone() : "")
                .bind("ticketCode", ticketData.getTicketCode())
                .bind("status", ticketData.getStatus())
                .bind("registeredAt", ticketData.getRegisteredAt())
                .filter((statement, next) -> statement.returnGeneratedValues("id").execute())
                .fetch()
                .first()
                .map(result -> {
                    ticketData.setId(((Number) result.get("id")).longValue());
                    return ticketData;
                });
    }

    @Override
    public Mono<EventTicket> cancelTicket(Long ticketId) {
        return databaseClient.sql("UPDATE event_tickets SET status = 'CANCELLED' WHERE id = :ticketId")
                .bind("ticketId", ticketId)
                .fetch()
                .rowsUpdated()
                .flatMap(rows -> findTicketById(ticketId));
    }

    @Override
    public Mono<EventTicket> checkInTicket(Long ticketId) {
        LocalDateTime now = LocalDateTime.now();
        return databaseClient.sql("UPDATE event_tickets SET status = 'CHECKED_IN', checked_in_at = :checkedInAt WHERE id = :ticketId")
                .bind("ticketId", ticketId)
                .bind("checkedInAt", now)
                .fetch()
                .rowsUpdated()
                .flatMap(rows -> findTicketById(ticketId));
    }

    @Override
    public Mono<EventTicket> findTicketByCode(String ticketCode) {
        return databaseClient.sql("SELECT * FROM event_tickets WHERE ticket_code = :ticketCode")
                .bind("ticketCode", ticketCode)
                .map((row, metadata) -> mapRowToTicket(row))
                .first();
    }

    @Override
    public Mono<Map<String, Object>> findTicketsByEvent(Long eventId, int page, int limit) {
        int offset = page * limit;

        return databaseClient.sql("""
                SELECT * FROM event_tickets
                WHERE event_id = :eventId
                ORDER BY registered_at DESC
                LIMIT :limit OFFSET :offset
                """)
                .bind("eventId", eventId)
                .bind("limit", limit)
                .bind("offset", offset)
                .map((row, metadata) -> mapRowToTicket(row))
                .all()
                .collectList()
                .zipWith(databaseClient.sql("SELECT COUNT(*) as total FROM event_tickets WHERE event_id = :eventId")
                        .bind("eventId", eventId)
                        .map((row, metadata) -> row.get("total", Long.class))
                        .first())
                .map(tuple -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("tickets", tuple.getT1());
                    result.put("total", tuple.getT2());
                    result.put("page", page);
                    result.put("limit", limit);
                    return result;
                });
    }

    @Override
    public Mono<Map<String, Object>> findTicketsByMember(Long memberId, int page, int limit) {
        int offset = page * limit;

        return databaseClient.sql("""
                SELECT * FROM event_tickets
                WHERE member_id = :memberId
                ORDER BY registered_at DESC
                LIMIT :limit OFFSET :offset
                """)
                .bind("memberId", memberId)
                .bind("limit", limit)
                .bind("offset", offset)
                .map((row, metadata) -> mapRowToTicket(row))
                .all()
                .collectList()
                .zipWith(databaseClient.sql("SELECT COUNT(*) as total FROM event_tickets WHERE member_id = :memberId")
                        .bind("memberId", memberId)
                        .map((row, metadata) -> row.get("total", Long.class))
                        .first())
                .map(tuple -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("tickets", tuple.getT1());
                    result.put("total", tuple.getT2());
                    result.put("page", page);
                    result.put("limit", limit);
                    return result;
                });
    }

    @Override
    public Mono<Long> countRegisteredTickets(Long eventId) {
        return databaseClient.sql("SELECT COUNT(*) as count FROM event_tickets WHERE event_id = :eventId AND status = 'REGISTERED'")
                .bind("eventId", eventId)
                .map((row, metadata) -> row.get("count", Long.class))
                .first();
    }

    @Override
    public Mono<Map<String, Object>> getEventStatistics(Long eventId) {
        return findEventById(eventId)
                .zipWith(countRegisteredTickets(eventId))
                .zipWith(databaseClient.sql("SELECT COUNT(*) as count FROM event_tickets WHERE event_id = :eventId AND status = 'CHECKED_IN'")
                        .bind("eventId", eventId)
                        .map((row, metadata) -> row.get("count", Long.class))
                        .first())
                .map(tuple -> {
                    Event event = tuple.getT1().getT1();
                    Long registeredCount = tuple.getT1().getT2();
                    Long checkedInCount = tuple.getT2();

                    Map<String, Object> stats = new HashMap<>();
                    stats.put("eventId", eventId);
                    stats.put("interestedCount", event.getInterestedCount());
                    stats.put("registeredCount", registeredCount);
                    stats.put("checkedInCount", checkedInCount);
                    stats.put("maxCapacity", event.getMaxCapacity());
                    stats.put("availableSlots", event.getMaxCapacity() != null ? event.getMaxCapacity() - registeredCount : null);
                    return stats;
                });
    }

    private Mono<EventTicket> findTicketById(Long ticketId) {
        return databaseClient.sql("SELECT * FROM event_tickets WHERE id = :ticketId")
                .bind("ticketId", ticketId)
                .map((row, metadata) -> mapRowToTicket(row))
                .first();
    }

    private Event mapRowToEvent(io.r2dbc.spi.Row row) {
        return Event.builder()
                .id(row.get("id", Long.class))
                .organizationId(row.get("organization_id", Long.class))
                .creatorMemberId(row.get("creator_member_id", Long.class))
                .title(row.get("title", String.class))
                .description(row.get("description", String.class))
                .bannerUrl(row.get("banner_url", String.class))
                .location(row.get("location", String.class))
                .startTime(row.get("start_time", LocalDateTime.class))
                .endTime(row.get("end_time", LocalDateTime.class))
                .registrationStartAt(row.get("registration_start_at", LocalDateTime.class))
                .registrationEndAt(row.get("registration_end_at", LocalDateTime.class))
                .maxCapacity(row.get("max_capacity", Integer.class))
                .interestedCount(row.get("interested_count", Integer.class))
                .isPublished(row.get("is_published", Boolean.class))
                .createdAt(row.get("created_at", LocalDateTime.class))
                .build();
    }

    private EventTicket mapRowToTicket(io.r2dbc.spi.Row row) {
        return EventTicket.builder()
                .id(row.get("id", Long.class))
                .eventId(row.get("event_id", Long.class))
                .memberId(row.get("member_id", Long.class))
                .guestName(row.get("guest_name", String.class))
                .guestEmail(row.get("guest_email", String.class))
                .guestPhone(row.get("guest_phone", String.class))
                .ticketCode(row.get("ticket_code", String.class))
                .status(row.get("status", String.class))
                .registeredAt(row.get("registered_at", LocalDateTime.class))
                .checkedInAt(row.get("checked_in_at", LocalDateTime.class))
                .build();
    }
}
