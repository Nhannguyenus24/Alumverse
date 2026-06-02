package com.service.backend.event.service;

import com.service.backend.shared.entity.Event;
import com.service.backend.shared.entity.EventInterest;
import com.service.backend.shared.entity.EventTicket;
import com.service.backend.event.dao.IEventRepository;
import com.service.backend.event.dto.CreateEventRequest;
import com.service.backend.event.dto.RegisterTicketRequest;
import com.service.backend.event.dto.UpdateEventRequest;
import com.service.backend.event.dto.EventStatisticsResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.service.ImageService;
import com.service.backend.shared.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class EventService {

    private final IEventRepository eventRepository;
    private final ImageService imageService;

    public Mono<Event> createEvent(CreateEventRequest request) {
        return Mono.zip(SecurityUtils.getCurrentUserId(), SecurityUtils.getCurrentOrganizationId())
                .flatMap(ctx -> {
                    Long userId = ctx.getT1();
                    Long orgId = ctx.getT2().longValue();
                    return imageService.uploadBase64IfPresent(request.getBannerBase64())
                            .defaultIfEmpty(request.getBannerUrl() == null ? "" : request.getBannerUrl())
                            .flatMap(bannerUrl -> {
                                Event event = Event.builder()
                                        .title(request.getTitle())
                                        .description(request.getDescription())
                                        .bannerUrl(bannerUrl.isEmpty() ? null : bannerUrl)
                                        .location(request.getLocation())
                                        .startTime(request.getStartTime())
                                        .endTime(request.getEndTime())
                                        .registrationStartAt(request.getRegistrationStartAt())
                                        .registrationEndAt(request.getRegistrationEndAt())
                                        .maxCapacity(request.getMaxCapacity())
                                        .topic(request.getTopic())
                                        .creatorMemberId(userId)
                                        .organizationId(orgId)
                                        .build();
                                return eventRepository.createEvent(event);
                            });
                });
    }

    public Mono<Event> updateEvent(Long eventId, UpdateEventRequest request) {
        return eventRepository.findEventById(eventId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found with id: " + eventId)))
                .flatMap(existingEvent -> imageService.uploadBase64IfPresent(request.getBannerBase64())
                        .defaultIfEmpty(request.getBannerUrl() == null ? "" : request.getBannerUrl())
                        .flatMap(bannerUrl -> {
                            Event updatedEvent = Event.builder()
                                    .title(request.getTitle())
                                    .description(request.getDescription())
                                    .bannerUrl(bannerUrl.isEmpty() ? existingEvent.getBannerUrl() : bannerUrl)
                                    .location(request.getLocation())
                                    .startTime(request.getStartTime())
                                    .endTime(request.getEndTime())
                                    .registrationStartAt(request.getRegistrationStartAt())
                                    .registrationEndAt(request.getRegistrationEndAt())
                                    .maxCapacity(request.getMaxCapacity())
                                    .topic(request.getTopic() != null ? request.getTopic() : existingEvent.getTopic())
                                    .build();
                            return eventRepository.updateEvent(eventId, updatedEvent);
                        }));
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
        return SecurityUtils.getCurrentOrganizationId()
                .flatMap(orgId -> eventRepository.findEventsByOrganization(orgId.longValue(), page, limit));
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
        return SecurityUtils.getCurrentOrganizationId()
                .flatMap(orgId -> eventRepository.findUpcomingEvents(orgId.longValue(), page, limit));
    }

    public Mono<PaginatedResponse<Event>> getPastEvents(int page, int limit) {
        return SecurityUtils.getCurrentOrganizationId()
                .flatMap(orgId -> eventRepository.findPastEvents(orgId.longValue(), page, limit));
    }

    public Mono<PaginatedResponse<Event>> searchEvents(String keyword, int page, int limit) {
        return SecurityUtils.getCurrentOrganizationId()
                .flatMap(orgId -> eventRepository.searchEvents(orgId.longValue(), keyword, page, limit));
    }

    public Mono<EventInterest> addInterest(Long eventId) {
        return SecurityUtils.getCurrentUserId().flatMap(memberId ->
                eventRepository.findEventById(eventId)
                        .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found with id: " + eventId)))
                        .flatMap(event -> eventRepository.checkUserInterest(eventId, memberId))
                        .flatMap(alreadyInterested -> {
                            if (alreadyInterested) {
                                return Mono.error(new ApplicationException(ErrorCode.ALREADY_INTERESTED, "User already interested in this event"));
                            }
                            return eventRepository.addEventInterest(eventId, memberId);
                        }));
    }

    public Mono<Boolean> removeInterest(Long eventId) {
        return SecurityUtils.getCurrentUserId().flatMap(memberId ->
                eventRepository.findEventById(eventId)
                        .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found with id: " + eventId)))
                        .flatMap(event -> eventRepository.removeEventInterest(eventId, memberId)));
    }

    public Mono<Boolean> checkInterest(Long eventId) {
        return SecurityUtils.getCurrentUserId().flatMap(memberId ->
                eventRepository.checkUserInterest(eventId, memberId));
    }

    public Mono<PaginatedResponse<EventInterest>> getEventInterests(Long eventId, int page, int limit) {
        return eventRepository.findEventInterests(eventId, page, limit);
    }

    public Mono<EventTicket> registerForEvent(Long eventId, RegisterTicketRequest request) {
        return SecurityUtils.getCurrentUserId().flatMap(memberId ->
                eventRepository.findEventById(eventId)
                        .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found with id: " + eventId)))
                        .flatMap(event -> {
                            EventTicket ticket = EventTicket.builder()
                                    .eventId(eventId)
                                    .memberId(memberId)
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
                        }));
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
        return SecurityUtils.getCurrentUserId()
                .flatMap(memberId -> eventRepository.findTicketsByMember(memberId, page, limit));
    }

    public Mono<EventStatisticsResponse> getEventStatistics(Long eventId) {
        return eventRepository.findEventById(eventId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found with id: " + eventId)))
                .flatMap(event -> eventRepository.getEventStatistics(eventId));
    }
}
