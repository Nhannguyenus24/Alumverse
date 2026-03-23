package com.service.backend.event.dao;

import com.service.backend.event.entity.Event;
import com.service.backend.event.entity.EventInterest;
import com.service.backend.event.entity.EventTicket;
import com.service.backend.event.dto.EventStatisticsResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import reactor.core.publisher.Mono;

/**
 * Repository interface for event management operations
 */
public interface IEventRepository {

    // Event CRUD
    Mono<Event> createEvent(Event eventData);
    Mono<Event> updateEvent(Long eventId, Event eventData);
    Mono<Boolean> deleteEvent(Long eventId);
    Mono<Event> findEventById(Long eventId);
    Mono<PaginatedResponse<Event>> findEventsByOrganization(Long organizationId, int page, int limit);

    // Event Publishing
    Mono<Event> publishEvent(Long eventId);
    Mono<Event> unpublishEvent(Long eventId);

    // Event Search & Filter
    Mono<PaginatedResponse<Event>> findUpcomingEvents(Long organizationId, int page, int limit);
    Mono<PaginatedResponse<Event>> findPastEvents(Long organizationId, int page, int limit);
    Mono<PaginatedResponse<Event>> searchEvents(Long organizationId, String keyword, int page, int limit);

    // Event Interest
    Mono<EventInterest> addEventInterest(Long eventId, Long memberId);
    Mono<Boolean> removeEventInterest(Long eventId, Long memberId);
    Mono<PaginatedResponse<EventInterest>> findEventInterests(Long eventId, int page, int limit);
    Mono<Boolean> checkUserInterest(Long eventId, Long memberId);
    Mono<Event> updateInterestedCount(Long eventId, Boolean increment);

    // Event Ticket Management
    Mono<EventTicket> registerTicket(EventTicket ticketData);
    Mono<EventTicket> cancelTicket(Long ticketId);
    Mono<EventTicket> checkInTicket(Long ticketId);
    Mono<EventTicket> findTicketByCode(String ticketCode);
    Mono<PaginatedResponse<EventTicket>> findTicketsByEvent(Long eventId, int page, int limit);
    Mono<PaginatedResponse<EventTicket>> findTicketsByMember(Long memberId, int page, int limit);
    Mono<Long> countRegisteredTickets(Long eventId);

    // Event Statistics
    Mono<EventStatisticsResponse> getEventStatistics(Long eventId);
}
