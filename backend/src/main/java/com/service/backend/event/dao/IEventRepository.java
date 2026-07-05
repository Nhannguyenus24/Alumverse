package com.service.backend.event.dao;

import com.service.backend.shared.entity.Event;
import com.service.backend.shared.entity.EventEmailLog;
import com.service.backend.shared.entity.EventInterest;
import com.service.backend.shared.entity.EventInvitation;
import com.service.backend.shared.entity.EventQuestion;
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
    Mono<PaginatedResponse<Event>> findUpcomingEvents(int page, int limit);
    Mono<PaginatedResponse<Event>> findPastEvents(Long organizationId, int page, int limit);
    Mono<PaginatedResponse<Event>> searchEvents(Long organizationId, String keyword, int page, int limit);

    // Event Interest
    Mono<EventInterest> addEventInterest(Long eventId, Long memberId);
    Mono<Boolean> removeEventInterest(Long eventId, Long memberId);
    Mono<PaginatedResponse<EventInterest>> findEventInterests(Long eventId, int page, int limit);
    Mono<Boolean> checkUserInterest(Long eventId, Long memberId);
    Mono<Boolean> checkUserRegistered(Long eventId, Long memberId);

    Mono<EventTicket> registerTicket(EventTicket ticketData);
    Mono<Boolean> hasRegistered(Long eventId, Long memberId);

    Flux<EventTicket> findIssuedTicketsByEvent(Long eventId);

    Mono<EventTicket> cancelTicket(Long ticketId, String reason);
    Mono<EventTicket> checkInTicket(Long ticketId);

    Mono<EventTicket> findTicketByCode(String ticketCode);
    Flux<EventTicket> findTicketsByIds(Iterable<Long> ticketIds);
    Mono<PaginatedResponse<EventTicket>> findTicketsByEvent(Long eventId, int page, int limit);
    Mono<PaginatedResponse<EventTicket>> findTicketsByEventAndStatus(Long eventId, String status, int page, int limit);
    Mono<PaginatedResponse<EventTicket>> searchTicketsByEvent(Long eventId, String keyword, int page, int limit);
    Mono<PaginatedResponse<EventTicket>> searchTicketsByEventAndStatus(Long eventId, String status, String keyword, int page, int limit);
    Mono<PaginatedResponse<EventTicket>> findTicketsByMember(Long memberId, int page, int limit);
    Mono<Long> countRegisteredTickets(Long eventId);

    Mono<EventInvitation> createInvitation(EventInvitation invitation);
    Mono<EventInvitation> findInvitationByToken(String token);
    Mono<EventInvitation> confirmInvitation(Long invitationId);
    Mono<PaginatedResponse<EventInvitation>> findInvitationsByEvent(Long eventId, int page, int limit);

    // Email logs
    Mono<EventEmailLog> saveEmailLog(EventEmailLog log);
    Mono<PaginatedResponse<EventEmailLog>> findEmailLogsByEvent(Long eventId, int page, int limit);

    // Statistics
    Mono<EventStatisticsResponse> getEventStatistics(Long eventId);

    // Event questions
    Flux<EventQuestion> findQuestionsByEvent(Long eventId);
    Mono<EventQuestion> findQuestionById(Integer questionId);
    Mono<EventQuestion> createQuestion(EventQuestion question);
    Mono<EventQuestion> updateQuestion(Integer questionId, EventQuestion question);
    Mono<Boolean> deleteQuestion(Long eventId, Integer questionId);
    Mono<Boolean> reorderQuestions(Long eventId, java.util.List<Integer> questionIds);
}
