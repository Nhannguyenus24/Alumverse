package com.service.backend.eventmodule.usecase;

import com.service.backend.eventmodule.domain.entity.Event;
import com.service.backend.eventmodule.domain.entity.EventInterest;
import com.service.backend.eventmodule.domain.entity.EventTicket;
import com.service.backend.eventmodule.domain.repository.IEventRepository;
import com.service.backend.eventmodule.presentation.dto.request.CreateEventRequest;
import com.service.backend.eventmodule.presentation.dto.request.RegisterTicketRequest;
import com.service.backend.eventmodule.presentation.dto.request.UpdateEventRequest;
import com.service.backend.eventmodule.presentation.dto.response.EventStatisticsResponse;
import com.service.backend.eventmodule.presentation.dto.response.PaginatedResponse;
import com.service.backend.shared.constants.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class EventService {

    private final IEventRepository eventRepository;

    private static final Long MOCK_MEMBER_ID = 1L;
    private static final Long MOCK_ORGANIZATION_ID = 1L;

    public Mono<Event> createEvent(CreateEventRequest request) {
        Event event = Event.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .bannerUrl(request.getBannerUrl())
                .location(request.getLocation())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .registrationStartAt(request.getRegistrationStartAt())
                .registrationEndAt(request.getRegistrationEndAt())
                .maxCapacity(request.getMaxCapacity())
                .creatorMemberId(MOCK_MEMBER_ID)
                .organizationId(MOCK_ORGANIZATION_ID)
                .build();

        return eventRepository.createEvent(event);
    }

    public Mono<Event> updateEvent(Long eventId, UpdateEventRequest request) {
        return eventRepository.findEventById(eventId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found with id: " + eventId)))
                .flatMap(existingEvent -> {
                    Event updatedEvent = Event.builder()
                            .title(request.getTitle())
                            .description(request.getDescription())
                            .bannerUrl(request.getBannerUrl())
                            .location(request.getLocation())
                            .startTime(request.getStartTime())
                            .endTime(request.getEndTime())
                            .registrationStartAt(request.getRegistrationStartAt())
                            .registrationEndAt(request.getRegistrationEndAt())
                            .maxCapacity(request.getMaxCapacity())
                            .build();
                    return eventRepository.updateEvent(eventId, updatedEvent);
                });
    }

    public Mono<Boolean> deleteEvent(Long eventId) {
        return eventRepository.findEventById(eventId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found with id: " + eventId)))
                .flatMap(existingEvent -> eventRepository.deleteEvent(eventId));
    }

    public Mono<Event> getEventById(Long eventId) {
        return eventRepository.findEventById(eventId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found with id: " + eventId)));
    }

    public Mono<PaginatedResponse<Event>> getEventsByOrganization(int page, int limit) {
        return eventRepository.findEventsByOrganization(MOCK_ORGANIZATION_ID, page, limit);
    }

    public Mono<Event> publishEvent(Long eventId) {
        return eventRepository.findEventById(eventId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found with id: " + eventId)))
                .flatMap(event -> eventRepository.publishEvent(eventId));
    }

    public Mono<Event> unpublishEvent(Long eventId) {
        return eventRepository.findEventById(eventId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found with id: " + eventId)))
                .flatMap(event -> eventRepository.unpublishEvent(eventId));
    }

    public Mono<PaginatedResponse<Event>> getUpcomingEvents(int page, int limit) {
        return eventRepository.findUpcomingEvents(MOCK_ORGANIZATION_ID, page, limit);
    }

    public Mono<PaginatedResponse<Event>> getPastEvents(int page, int limit) {
        return eventRepository.findPastEvents(MOCK_ORGANIZATION_ID, page, limit);
    }

    public Mono<PaginatedResponse<Event>> searchEvents(String keyword, int page, int limit) {
        return eventRepository.searchEvents(MOCK_ORGANIZATION_ID, keyword, page, limit);
    }

    public Mono<EventInterest> addInterest(Long eventId) {
        return eventRepository.findEventById(eventId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found with id: " + eventId)))
                .flatMap(event -> eventRepository.checkUserInterest(eventId, MOCK_MEMBER_ID))
                .flatMap(alreadyInterested -> {
                    if (alreadyInterested) {
                        return Mono.error(new ApplicationException(ErrorCode.ALREADY_INTERESTED, "User already interested in this event"));
                    }
                    return eventRepository.addEventInterest(eventId, MOCK_MEMBER_ID);
                });
    }

    public Mono<Boolean> removeInterest(Long eventId) {
        return eventRepository.findEventById(eventId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found with id: " + eventId)))
                .flatMap(event -> eventRepository.removeEventInterest(eventId, MOCK_MEMBER_ID));
    }

    public Mono<Boolean> checkInterest(Long eventId) {
        return eventRepository.checkUserInterest(eventId, MOCK_MEMBER_ID);
    }

    public Mono<PaginatedResponse<EventInterest>> getEventInterests(Long eventId, int page, int limit) {
        return eventRepository.findEventInterests(eventId, page, limit);
    }

    public Mono<EventTicket> registerForEvent(Long eventId, RegisterTicketRequest request) {
        return eventRepository.findEventById(eventId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found with id: " + eventId)))
                .flatMap(event -> {
                    EventTicket ticket = EventTicket.builder()
                            .eventId(eventId)
                            .memberId(MOCK_MEMBER_ID)
                            .guestName(request != null ? request.getGuestName() : null)
                            .guestEmail(request != null ? request.getGuestEmail() : null)
                            .guestPhone(request != null ? request.getGuestPhone() : null)
                            .build();

                    if (event.getMaxCapacity() != null && event.getMaxCapacity() > 0) {
                        return eventRepository.countRegisteredTickets(eventId)
                                .flatMap(count -> {
                                    if (count >= event.getMaxCapacity()) {
                                        return Mono.error(new ApplicationException(ErrorCode.EVENT_FULLY_BOOKED, "Event is fully booked"));
                                    }
                                    return eventRepository.registerTicket(ticket);
                                });
                    }
                    return eventRepository.registerTicket(ticket);
                });
    }

    public Mono<EventTicket> cancelTicket(String ticketCode) {
        return eventRepository.findTicketByCode(ticketCode)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.TICKET_NOT_FOUND, "Ticket not found")))
                .flatMap(ticket -> eventRepository.cancelTicket(ticket.getId()));
    }

    public Mono<EventTicket> checkInTicket(String ticketCode) {
        return eventRepository.findTicketByCode(ticketCode)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.TICKET_NOT_FOUND, "Ticket not found")))
                .flatMap(ticket -> {
                    if ("CANCELLED".equals(ticket.getStatus())) {
                        return Mono.error(new ApplicationException(ErrorCode.TICKET_ALREADY_CANCELLED, "Cannot check in a cancelled ticket"));
                    }
                    if ("CHECKED_IN".equals(ticket.getStatus())) {
                        return Mono.error(new ApplicationException(ErrorCode.TICKET_ALREADY_CHECKED_IN, "Ticket already checked in"));
                    }
                    return eventRepository.checkInTicket(ticket.getId());
                });
    }

    public Mono<EventTicket> getTicketByCode(String ticketCode) {
        return eventRepository.findTicketByCode(ticketCode)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.TICKET_NOT_FOUND, "Ticket not found with code: " + ticketCode)));
    }

    public Mono<PaginatedResponse<EventTicket>> getTicketsByEvent(Long eventId, int page, int limit) {
        return eventRepository.findTicketsByEvent(eventId, page, limit);
    }

    public Mono<PaginatedResponse<EventTicket>> getMyTickets(int page, int limit) {
        return eventRepository.findTicketsByMember(MOCK_MEMBER_ID, page, limit);
    }

    public Mono<EventStatisticsResponse> getEventStatistics(Long eventId) {
        return eventRepository.findEventById(eventId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found with id: " + eventId)))
                .flatMap(event -> eventRepository.getEventStatistics(eventId));
    }
}
