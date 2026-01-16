package com.service.backend.domain.repository;

import com.service.backend.domain.entity.Event;
import com.service.backend.domain.entity.EventInterest;
import com.service.backend.domain.entity.EventTicket;
import reactor.core.publisher.Mono;

import java.util.Map;

/**
 * Repository interface for event management operations
 */
public interface IEventRepository {

    // Event CRUD
    Mono<Event> createEvent(Event eventData);
    Mono<Event> updateEvent(Long eventId, Event eventData);
    Mono<Boolean> deleteEvent(Long eventId);
    Mono<Event> findEventById(Long eventId);
    Mono<Map<String, Object>> findEventsByOrganization(Long organizationId, int page, int limit, Map<String, Object> filters);

    // Event Publishing
    Mono<Event> publishEvent(Long eventId);
    Mono<Event> unpublishEvent(Long eventId);

    // Event Search & Filter
    Mono<Map<String, Object>> findUpcomingEvents(Long organizationId, int page, int limit);
    Mono<Map<String, Object>> findPastEvents(Long organizationId, int page, int limit);
    Mono<Map<String, Object>> searchEvents(Long organizationId, String keyword, int page, int limit);

    // Event Interest
    Mono<EventInterest> addEventInterest(Long eventId, Long memberId);
    Mono<Boolean> removeEventInterest(Long eventId, Long memberId);
    Mono<Map<String, Object>> findEventInterests(Long eventId, int page, int limit);
    Mono<Boolean> checkUserInterest(Long eventId, Long memberId);
    Mono<Event> updateInterestedCount(Long eventId, Boolean increment);

    // Event Ticket Management
    Mono<EventTicket> registerTicket(EventTicket ticketData);
    Mono<EventTicket> cancelTicket(Long ticketId);
    Mono<EventTicket> checkInTicket(Long ticketId);
    Mono<EventTicket> findTicketByCode(String ticketCode);
    Mono<Map<String, Object>> findTicketsByEvent(Long eventId, int page, int limit);
    Mono<Map<String, Object>> findTicketsByMember(Long memberId, int page, int limit);
    Mono<Long> countRegisteredTickets(Long eventId);

    // Event Statistics
    Mono<Map<String, Object>> getEventStatistics(Long eventId);
}
