package com.service.backend.eventmodule.presentation.controller;

import com.service.backend.eventmodule.usecase.EventService;
import com.service.backend.eventmodule.domain.entity.Event;
import com.service.backend.eventmodule.domain.entity.EventTicket;
import com.service.backend.eventmodule.presentation.dto.request.CreateEventRequest;
import com.service.backend.eventmodule.presentation.dto.request.UpdateEventRequest;
import com.service.backend.eventmodule.presentation.dto.request.RegisterTicketRequest;
import com.service.backend.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ApiResponse<Event>> createEvent(@Valid @RequestBody CreateEventRequest request) {
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
                .build();

        return eventService.createEvent(event)
                .map(createdEvent -> new ApiResponse<>("Event created successfully", createdEvent));
    }

    @PutMapping("/{eventId}")
    public Mono<ApiResponse<Event>> updateEvent(
            @PathVariable Long eventId,
            @Valid @RequestBody UpdateEventRequest request) {
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
                .build();

        return eventService.updateEvent(eventId, event)
                .map(updatedEvent -> new ApiResponse<>("Event updated successfully", updatedEvent));
    }

    @DeleteMapping("/{eventId}")
    public Mono<ApiResponse<Void>> deleteEvent(@PathVariable Long eventId) {
        return eventService.deleteEvent(eventId)
                .map(deleted -> new ApiResponse<>("Event deleted successfully", null));
    }

    @GetMapping("/{eventId}")
    public Mono<ApiResponse<Event>> getEventById(@PathVariable Long eventId) {
        return eventService.getEventById(eventId)
                .map(event -> new ApiResponse<>("Event retrieved successfully", event));
    }

    @GetMapping
    public Mono<ApiResponse<Map<String, Object>>> getEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int limit) {
        return eventService.getEventsByOrganization(page, limit, new HashMap<>())
                .map(events -> new ApiResponse<>("Events retrieved successfully", events));
    }

    @PostMapping("/{eventId}/publish")
    public Mono<ApiResponse<Event>> publishEvent(@PathVariable Long eventId) {
        return eventService.publishEvent(eventId)
                .map(event -> new ApiResponse<>("Event published successfully", event));
    }

    @PostMapping("/{eventId}/unpublish")
    public Mono<ApiResponse<Event>> unpublishEvent(@PathVariable Long eventId) {
        return eventService.unpublishEvent(eventId)
                .map(event -> new ApiResponse<>("Event unpublished successfully", event));
    }

    @GetMapping("/upcoming")
    public Mono<ApiResponse<Map<String, Object>>> getUpcomingEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int limit) {
        return eventService.getUpcomingEvents(page, limit)
                .map(events -> new ApiResponse<>("Upcoming events retrieved successfully", events));
    }

    @GetMapping("/past")
    public Mono<ApiResponse<Map<String, Object>>> getPastEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int limit) {
        return eventService.getPastEvents(page, limit)
                .map(events -> new ApiResponse<>("Past events retrieved successfully", events));
    }

    @GetMapping("/search")
    public Mono<ApiResponse<Map<String, Object>>> searchEvents(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int limit) {
        return eventService.searchEvents(keyword, page, limit)
                .map(events -> new ApiResponse<>("Search results retrieved successfully", events));
    }

    @PostMapping("/{eventId}/interest")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ApiResponse<?>> addInterest(@PathVariable Long eventId) {
        return eventService.addInterest(eventId)
                .map(interest -> new ApiResponse<>("Interest added successfully", interest));
    }

    @DeleteMapping("/{eventId}/interest")
    public Mono<ApiResponse<Void>> removeInterest(@PathVariable Long eventId) {
        return eventService.removeInterest(eventId)
                .map(removed -> new ApiResponse<>("Interest removed successfully", null));
    }

    @GetMapping("/{eventId}/interest/check")
    public Mono<ApiResponse<Map<String, Boolean>>> checkInterest(@PathVariable Long eventId) {
        return eventService.checkInterest(eventId)
                .map(isInterested -> {
                    Map<String, Boolean> result = new HashMap<>();
                    result.put("isInterested", isInterested);
                    return new ApiResponse<>("Interest status retrieved", result);
                });
    }

    @GetMapping("/{eventId}/interests")
    public Mono<ApiResponse<Map<String, Object>>> getEventInterests(
            @PathVariable Long eventId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int limit) {
        return eventService.getEventInterests(eventId, page, limit)
                .map(interests -> new ApiResponse<>("Event interests retrieved successfully", interests));
    }

    @PostMapping("/{eventId}/register")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ApiResponse<EventTicket>> registerForEvent(
            @PathVariable Long eventId,
            @RequestBody(required = false) RegisterTicketRequest request) {
        EventTicket ticket = EventTicket.builder()
                .guestName(request != null ? request.getGuestName() : null)
                .guestEmail(request != null ? request.getGuestEmail() : null)
                .guestPhone(request != null ? request.getGuestPhone() : null)
                .build();

        return eventService.registerForEvent(eventId, ticket)
                .map(registeredTicket -> new ApiResponse<>("Registered successfully", registeredTicket));
    }

    @PostMapping("/tickets/{ticketId}/cancel")
    public Mono<ApiResponse<EventTicket>> cancelTicket(@PathVariable Long ticketId) {
        return eventService.cancelTicket(ticketId)
                .map(ticket -> new ApiResponse<>("Ticket cancelled successfully", ticket));
    }

    @PostMapping("/tickets/{ticketId}/check-in")
    public Mono<ApiResponse<EventTicket>> checkInTicket(@PathVariable Long ticketId) {
        return eventService.checkInTicket(ticketId)
                .map(ticket -> new ApiResponse<>("Checked in successfully", ticket));
    }

    @GetMapping("/tickets/code/{ticketCode}")
    public Mono<ApiResponse<EventTicket>> getTicketByCode(@PathVariable String ticketCode) {
        return eventService.getTicketByCode(ticketCode)
                .map(ticket -> new ApiResponse<>("Ticket retrieved successfully", ticket));
    }

    @GetMapping("/{eventId}/tickets")
    public Mono<ApiResponse<Map<String, Object>>> getTicketsByEvent(
            @PathVariable Long eventId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int limit) {
        return eventService.getTicketsByEvent(eventId, page, limit)
                .map(tickets -> new ApiResponse<>("Event tickets retrieved successfully", tickets));
    }

    @GetMapping("/my-tickets")
    public Mono<ApiResponse<Map<String, Object>>> getMyTickets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int limit) {
        return eventService.getMyTickets(page, limit)
                .map(tickets -> new ApiResponse<>("My tickets retrieved successfully", tickets));
    }

    @GetMapping("/{eventId}/statistics")
    public Mono<ApiResponse<Map<String, Object>>> getEventStatistics(@PathVariable Long eventId) {
        return eventService.getEventStatistics(eventId)
                .map(stats -> new ApiResponse<>("Event statistics retrieved successfully", stats));
    }
}
