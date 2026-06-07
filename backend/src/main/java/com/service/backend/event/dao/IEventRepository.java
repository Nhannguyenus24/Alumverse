package com.service.backend.event.dao;

import com.service.backend.shared.entity.Event;
import com.service.backend.shared.entity.EventEmailLog;
import com.service.backend.shared.entity.EventInterest;
import com.service.backend.shared.entity.EventInvitation;
import com.service.backend.shared.entity.EventTicket;
import com.service.backend.event.dto.EventStatisticsResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

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
    Mono<Boolean> checkUserRegistered(Long eventId, Long memberId);

    Mono<EventTicket> registerTicket(EventTicket ticketData);
    Mono<Boolean> hasRegistered(Long eventId, Long memberId);

    Mono<EventTicket> approveTicket(Long ticketId, Long reviewedBy);
    Mono<EventTicket> rejectTicket(Long ticketId, Long reviewedBy, String reason);
    Mono<Integer> approveAllPendingTickets(Long eventId, Long reviewedBy);

    Flux<EventTicket> findIssuedTicketsByEvent(Long eventId);

    Mono<EventTicket> cancelTicket(Long ticketId);
    Mono<EventTicket> checkInTicket(Long ticketId);
    Mono<Integer> activateTicketsForEvent(Long eventId);
    Mono<Integer> expireTicketsForEvent(Long eventId);

    Mono<EventTicket> findTicketByCode(String ticketCode);
    Mono<EventTicket> findTicketById(Long ticketId);
    Mono<PaginatedResponse<EventTicket>> findTicketsByEvent(Long eventId, int page, int limit);
    Mono<PaginatedResponse<EventTicket>> findTicketsByEventAndStatus(Long eventId, String status, int page, int limit);
    Mono<PaginatedResponse<EventTicket>> findTicketsByMember(Long memberId, int page, int limit);
    Mono<Long> countRegisteredTickets(Long eventId);

    Mono<EventInvitation> createInvitation(EventInvitation invitation);
    Mono<EventInvitation> findInvitationByToken(String token);
    Mono<EventInvitation> confirmInvitation(Long invitationId);
    Mono<EventInvitation> declineInvitation(Long invitationId);
    Mono<Boolean> hasInvitation(Long eventId, Long memberId);
    Mono<PaginatedResponse<EventInvitation>> findInvitationsByEvent(Long eventId, int page, int limit);

    // Email logs
    Mono<EventEmailLog> saveEmailLog(EventEmailLog log);
    Mono<PaginatedResponse<EventEmailLog>> findEmailLogsByEvent(Long eventId, int page, int limit);

    // Statistics
    Mono<EventStatisticsResponse> getEventStatistics(Long eventId);
}
