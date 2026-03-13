package com.service.backend.admin.service;

import com.service.backend.eventmodule.domain.entity.Event;
import com.service.backend.eventmodule.domain.entity.EventInterest;
import com.service.backend.eventmodule.domain.entity.EventTicket;
import com.service.backend.eventmodule.domain.repository.IEventRepository;
import com.service.backend.eventmodule.presentation.dto.request.CreateEventRequest;
import com.service.backend.eventmodule.presentation.dto.request.UpdateEventRequest;
import com.service.backend.eventmodule.presentation.dto.response.EventStatisticsResponse;
import com.service.backend.eventmodule.presentation.dto.response.PaginatedResponse;
import com.service.backend.shared.constants.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminEventService {

    private final IEventRepository eventRepository;

    /**
     * Get all events in the system (admin functionality)
     */
    public Mono<PaginatedResponse<Event>> getAllEvents(int page, int limit) {
        return eventRepository.findAllEvents(page, limit)
                .onErrorMap(e -> new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Failed to retrieve all events: " + e.getMessage()));
    }

    /**
     * Get event details by ID
     */
    public Mono<Event> getEventDetails(Long eventId) {
        return eventRepository.findEventById(eventId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found with id: " + eventId)));
    }

    /**
     * Create a new event
     */
    public Mono<Event> createEvent(CreateEventRequest request) {
        return Mono.fromCallable(() -> Event.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .bannerUrl(request.getBannerUrl())
                .location(request.getLocation())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .registrationStartAt(request.getRegistrationStartAt())
                .registrationEndAt(request.getRegistrationEndAt())
                .maxCapacity(request.getMaxCapacity())
                .creatorMemberId(1L) // Admin ID can be retrieved from security context
                .organizationId(1L) // Organization ID can be retrieved from security context or admin settings
                .build())
                .flatMap(eventRepository::createEvent)
                .onErrorMap(e -> new ApplicationException(ErrorCode.INTERNAL_ERROR, "Failed to create event: " + e.getMessage()));
    }

    /**
     * Update event details
     */
    public Mono<Event> updateEvent(Long eventId, UpdateEventRequest request) {
        return eventRepository.findEventById(eventId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found with id: " + eventId)))
                .flatMap(existingEvent -> {
                    Event updatedEvent = Event.builder()
                            .id(eventId)
                            .title(request.getTitle())
                            .description(request.getDescription())
                            .bannerUrl(request.getBannerUrl())
                            .location(request.getLocation())
                            .startTime(request.getStartTime())
                            .endTime(request.getEndTime())
                            .registrationStartAt(request.getRegistrationStartAt())
                            .registrationEndAt(request.getRegistrationEndAt())
                            .maxCapacity(request.getMaxCapacity())
                            .creatorMemberId(existingEvent.getCreatorMemberId())
                            .organizationId(existingEvent.getOrganizationId())
                            .build();
                    return eventRepository.updateEvent(eventId, updatedEvent);
                })
                .onErrorMap(e -> {
                    if (e instanceof ApplicationException) return e;
                    return new ApplicationException(ErrorCode.INTERNAL_ERROR, "Failed to update event: " + e.getMessage());
                });
    }

    /**
     * Delete an event
     */
    public Mono<Void> deleteEvent(Long eventId) {
        return eventRepository.findEventById(eventId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found with id: " + eventId)))
                .flatMap(event -> eventRepository.deleteEvent(eventId))
                .then()
                .onErrorMap(e -> {
                    if (e instanceof ApplicationException) return e;
                    return new ApplicationException(ErrorCode.INTERNAL_ERROR, "Failed to delete event: " + e.getMessage());
                });
    }

    /**
     * Publish an event
     */
    public Mono<Event> publishEvent(Long eventId) {
        return eventRepository.findEventById(eventId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found with id: " + eventId)))
                .flatMap(event -> eventRepository.publishEvent(eventId))
                .onErrorMap(e -> {
                    if (e instanceof ApplicationException) return e;
                    return new ApplicationException(ErrorCode.INTERNAL_ERROR, "Failed to publish event: " + e.getMessage());
                });
    }

    /**
     * Unpublish an event
     */
    public Mono<Event> unpublishEvent(Long eventId) {
        return eventRepository.findEventById(eventId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found with id: " + eventId)))
                .flatMap(event -> eventRepository.unpublishEvent(eventId))
                .onErrorMap(e -> {
                    if (e instanceof ApplicationException) return e;
                    return new ApplicationException(ErrorCode.INTERNAL_ERROR, "Failed to unpublish event: " + e.getMessage());
                });
    }

    /**
     * Get upcoming events
     */
    public Mono<PaginatedResponse<Event>> getUpcomingEvents(int page, int limit) {
        return eventRepository.findUpcomingEvents(1L, page, limit) // Using default organization
                .onErrorMap(e -> new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Failed to retrieve upcoming events: " + e.getMessage()));
    }

    /**
     * Get past events
     */
    public Mono<PaginatedResponse<Event>> getPastEvents(int page, int limit) {
        return eventRepository.findPastEvents(1L, page, limit) // Using default organization
                .onErrorMap(e -> new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Failed to retrieve past events: " + e.getMessage()));
    }

    /**
     * Search events
     */
    public Mono<PaginatedResponse<Event>> searchEvents(String keyword, int page, int limit) {
        return eventRepository.searchEvents(1L, keyword, page, limit)
                .onErrorMap(e -> new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Failed to search events: " + e.getMessage()));
    }

    /**
     * Get event statistics
     */
    public Mono<EventStatisticsResponse> getEventStatistics(Long eventId) {
        return eventRepository.findEventById(eventId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found with id: " + eventId)))
                .onErrorMap(e -> {
                    if (e instanceof ApplicationException) return e;
                    return new ApplicationException(ErrorCode.INTERNAL_ERROR, "Failed to retrieve event statistics: " + e.getMessage());
                })
                .then(Mono.empty()); // Placeholder - actual implementation depends on IEventRepository
    }

    /**
     * Get event interests
     */
    public Mono<PaginatedResponse<EventInterest>> getEventInterests(Long eventId, int page, int limit) {
        return eventRepository.findEventById(eventId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found with id: " + eventId)))
                .then(Mono.empty()); // Placeholder - actual implementation depends on IEventRepository
    }

    /**
     * Get event tickets
     */
    public Mono<PaginatedResponse<EventTicket>> getTicketsByEvent(Long eventId, int page, int limit) {
        return eventRepository.findEventById(eventId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found with id: " + eventId)))
                .then(Mono.empty()); // Placeholder - actual implementation depends on IEventRepository
    }

    /**
     * Get ticket by code
     */
    public Mono<EventTicket> getTicketByCode(String ticketCode) {
        // Implementation depends on IEventRepository having this method
        return Mono.empty();
    }

    /**
     * Cancel a ticket
     */
    public Mono<EventTicket> cancelTicket(String ticketCode) {
        // Implementation depends on IEventRepository having this method
        return Mono.empty();
    }

    /**
     * Check in a ticket
     */
    public Mono<EventTicket> checkInTicket(String ticketCode) {
        // Implementation depends on IEventRepository having this method
        return Mono.empty();
    }

    /**
     * Remove user interest from event
     */
    public Mono<Void> removeUserInterest(Long eventId, Long userId) {
        return eventRepository.findEventById(eventId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found with id: " + eventId)))
                .then(Mono.empty()); // Placeholder - actual implementation depends on IEventRepository
    }

    /**
     * Bulk publish events
     */
    public Mono<Map<String, Object>> bulkPublishEvents(List<Long> eventIds) {
        if (eventIds == null || eventIds.isEmpty()) {
            return Mono.error(new ApplicationException(ErrorCode.BAD_REQUEST, "Event IDs cannot be empty"));
        }

        return Mono.fromIterable(eventIds)
                .flatMap(this::publishEvent)
                .collectList()
                .map(publishedEvents -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("totalRequested", eventIds.size());
                    result.put("successCount", publishedEvents.size());
                    result.put("failureCount", eventIds.size() - publishedEvents.size());
                    return result;
                })
                .onErrorMap(e -> new ApplicationException(ErrorCode.INTERNAL_ERROR, "Failed to bulk publish events: " + e.getMessage()));
    }

    /**
     * Bulk unpublish events
     */
    public Mono<Map<String, Object>> bulkUnpublishEvents(List<Long> eventIds) {
        if (eventIds == null || eventIds.isEmpty()) {
            return Mono.error(new ApplicationException(ErrorCode.BAD_REQUEST, "Event IDs cannot be empty"));
        }

        return Mono.fromIterable(eventIds)
                .flatMap(this::unpublishEvent)
                .collectList()
                .map(unpublishedEvents -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("totalRequested", eventIds.size());
                    result.put("successCount", unpublishedEvents.size());
                    result.put("failureCount", eventIds.size() - unpublishedEvents.size());
                    return result;
                })
                .onErrorMap(e -> new ApplicationException(ErrorCode.INTERNAL_ERROR, "Failed to bulk unpublish events: " + e.getMessage()));
    }

    /**
     * Bulk delete events
     */
    public Mono<Map<String, Object>> bulkDeleteEvents(List<Long> eventIds) {
        if (eventIds == null || eventIds.isEmpty()) {
            return Mono.error(new ApplicationException(ErrorCode.BAD_REQUEST, "Event IDs cannot be empty"));
        }

        return Mono.fromIterable(eventIds)
                .flatMap(this::deleteEvent)
                .collectList()
                .map(deletedCount -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("totalRequested", eventIds.size());
                    result.put("successCount", eventIds.size()); // If no error, all succeeded
                    result.put("failureCount", 0);
                    return result;
                })
                .onErrorMap(e -> new ApplicationException(ErrorCode.INTERNAL_ERROR, "Failed to bulk delete events: " + e.getMessage()));
    }
}
