package com.service.backend.eventmodule.usecase;

import com.service.backend.eventmodule.domain.entity.Event;
import com.service.backend.eventmodule.domain.entity.EventInterest;
import com.service.backend.eventmodule.domain.entity.EventTicket;
import com.service.backend.eventmodule.domain.repository.IEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class EventService {

    private final IEventRepository eventRepository;

    private static final Long MOCK_MEMBER_ID = 1L;
    private static final Long MOCK_ORGANIZATION_ID = 1L;

    public Mono<Event> createEvent(Event eventData) {
        eventData.setCreatorMemberId(MOCK_MEMBER_ID);
        eventData.setOrganizationId(MOCK_ORGANIZATION_ID);
        return eventRepository.createEvent(eventData);
    }

    public Mono<Event> updateEvent(Long eventId, Event eventData) {
        return eventRepository.findEventById(eventId)
                .switchIfEmpty(Mono.error(new NoSuchElementException("Event not found with id: " + eventId)))
                .flatMap(existingEvent -> eventRepository.updateEvent(eventId, eventData));
    }

    public Mono<Boolean> deleteEvent(Long eventId) {
        return eventRepository.findEventById(eventId)
                .switchIfEmpty(Mono.error(new NoSuchElementException("Event not found with id: " + eventId)))
                .flatMap(existingEvent -> eventRepository.deleteEvent(eventId));
    }

    public Mono<Event> getEventById(Long eventId) {
        return eventRepository.findEventById(eventId)
                .switchIfEmpty(Mono.error(new NoSuchElementException("Event not found with id: " + eventId)));
    }

    public Mono<Map<String, Object>> getEventsByOrganization(int page, int limit, Map<String, Object> filters) {
        return eventRepository.findEventsByOrganization(MOCK_ORGANIZATION_ID, page, limit, filters);
    }

    public Mono<Event> publishEvent(Long eventId) {
        return eventRepository.findEventById(eventId)
                .switchIfEmpty(Mono.error(new NoSuchElementException("Event not found with id: " + eventId)))
                .flatMap(event -> eventRepository.publishEvent(eventId));
    }

    public Mono<Event> unpublishEvent(Long eventId) {
        return eventRepository.findEventById(eventId)
                .switchIfEmpty(Mono.error(new NoSuchElementException("Event not found with id: " + eventId)))
                .flatMap(event -> eventRepository.unpublishEvent(eventId));
    }

    public Mono<Map<String, Object>> getUpcomingEvents(int page, int limit) {
        return eventRepository.findUpcomingEvents(MOCK_ORGANIZATION_ID, page, limit);
    }

    public Mono<Map<String, Object>> getPastEvents(int page, int limit) {
        return eventRepository.findPastEvents(MOCK_ORGANIZATION_ID, page, limit);
    }

    public Mono<Map<String, Object>> searchEvents(String keyword, int page, int limit) {
        return eventRepository.searchEvents(MOCK_ORGANIZATION_ID, keyword, page, limit);
    }

    public Mono<EventInterest> addInterest(Long eventId) {
        return eventRepository.findEventById(eventId)
                .switchIfEmpty(Mono.error(new NoSuchElementException("Event not found with id: " + eventId)))
                .flatMap(event -> eventRepository.checkUserInterest(eventId, MOCK_MEMBER_ID))
                .flatMap(alreadyInterested -> {
                    if (alreadyInterested) {
                        return Mono.error(new IllegalStateException("User already interested in this event"));
                    }
                    return eventRepository.addEventInterest(eventId, MOCK_MEMBER_ID);
                });
    }

    public Mono<Boolean> removeInterest(Long eventId) {
        return eventRepository.findEventById(eventId)
                .switchIfEmpty(Mono.error(new NoSuchElementException("Event not found with id: " + eventId)))
                .flatMap(event -> eventRepository.removeEventInterest(eventId, MOCK_MEMBER_ID));
    }

    public Mono<Boolean> checkInterest(Long eventId) {
        return eventRepository.checkUserInterest(eventId, MOCK_MEMBER_ID);
    }

    public Mono<Map<String, Object>> getEventInterests(Long eventId, int page, int limit) {
        return eventRepository.findEventInterests(eventId, page, limit);
    }

    public Mono<EventTicket> registerForEvent(Long eventId, EventTicket ticketData) {
        return eventRepository.findEventById(eventId)
                .switchIfEmpty(Mono.error(new NoSuchElementException("Event not found with id: " + eventId)))
                .flatMap(event -> {
                    if (event.getMaxCapacity() != null && event.getMaxCapacity() > 0) {
                        return eventRepository.countRegisteredTickets(eventId)
                                .flatMap(count -> {
                                    if (count >= event.getMaxCapacity()) {
                                        return Mono.error(new IllegalStateException("Event is fully booked"));
                                    }
                                    ticketData.setEventId(eventId);
                                    ticketData.setMemberId(MOCK_MEMBER_ID);
                                    return eventRepository.registerTicket(ticketData);
                                });
                    }
                    ticketData.setEventId(eventId);
                    ticketData.setMemberId(MOCK_MEMBER_ID);
                    return eventRepository.registerTicket(ticketData);
                });
    }

    public Mono<EventTicket> cancelTicket(String ticketCode) {
        return eventRepository.findTicketByCode(ticketCode)
                .switchIfEmpty(Mono.error(new NoSuchElementException("Ticket not found")))
                .flatMap(ticket -> eventRepository.cancelTicket(ticket.getId()));
    }

    public Mono<EventTicket> checkInTicket(String ticketCode) {
        return eventRepository.findTicketByCode(ticketCode)
                .switchIfEmpty(Mono.error(new NoSuchElementException("Ticket not found")))
                .flatMap(ticket -> {
                    if ("CANCELLED".equals(ticket.getStatus())) {
                        return Mono.error(new IllegalStateException("Cannot check in a cancelled ticket"));
                    }
                    if ("CHECKED_IN".equals(ticket.getStatus())) {
                        return Mono.error(new IllegalStateException("Ticket already checked in"));
                    }
                    return eventRepository.checkInTicket(ticket.getId());
                });
    }

    public Mono<EventTicket> getTicketByCode(String ticketCode) {
        return eventRepository.findTicketByCode(ticketCode)
                .switchIfEmpty(Mono.error(new NoSuchElementException("Ticket not found with code: " + ticketCode)));
    }

    public Mono<Map<String, Object>> getTicketsByEvent(Long eventId, int page, int limit) {
        return eventRepository.findTicketsByEvent(eventId, page, limit);
    }

    public Mono<Map<String, Object>> getMyTickets(int page, int limit) {
        return eventRepository.findTicketsByMember(MOCK_MEMBER_ID, page, limit);
    }

    public Mono<Map<String, Object>> getEventStatistics(Long eventId) {
        return eventRepository.findEventById(eventId)
                .switchIfEmpty(Mono.error(new NoSuchElementException("Event not found with id: " + eventId)))
                .flatMap(event -> eventRepository.getEventStatistics(eventId));
    }
}
