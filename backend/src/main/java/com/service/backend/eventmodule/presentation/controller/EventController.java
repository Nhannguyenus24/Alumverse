package com.service.backend.eventmodule.presentation.controller;

import com.service.backend.eventmodule.domain.entity.Event;
import com.service.backend.eventmodule.domain.entity.EventInterest;
import com.service.backend.eventmodule.domain.entity.EventTicket;
import com.service.backend.eventmodule.presentation.dto.request.CreateEventRequest;
import com.service.backend.eventmodule.presentation.dto.request.RegisterTicketRequest;
import com.service.backend.eventmodule.presentation.dto.request.UpdateEventRequest;
import com.service.backend.eventmodule.presentation.dto.response.EventStatisticsResponse;
import com.service.backend.eventmodule.presentation.dto.response.InterestCheckResponse;
import com.service.backend.eventmodule.presentation.dto.response.PaginatedResponse;
import com.service.backend.eventmodule.usecase.EventService;
import com.service.backend.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
@Validated
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
            @PathVariable @Min(1) Long eventId,
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
    public Mono<ApiResponse<Void>> deleteEvent(@PathVariable @Min(1) Long eventId) {
        return eventService.deleteEvent(eventId)
                .map(deleted -> new ApiResponse<>("Event deleted successfully", null));
    }

    @GetMapping("/{eventId}")
    public Mono<ApiResponse<Event>> getEventById(@PathVariable @Min(1) Long eventId) {
        return eventService.getEventById(eventId)
                .map(event -> new ApiResponse<>("Event retrieved successfully", event));
    }

    @GetMapping
    public Mono<ApiResponse<PaginatedResponse<Event>>> getEvents(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return eventService.getEventsByOrganization(page, limit)
                .map(events -> new ApiResponse<>("Events retrieved successfully", events));
    }

    @PostMapping("/{eventId}/publish")
    public Mono<ApiResponse<Event>> publishEvent(@PathVariable @Min(1) Long eventId) {
        return eventService.publishEvent(eventId)
                .map(event -> new ApiResponse<>("Event published successfully", event));
    }

    @PostMapping("/{eventId}/unpublish")
    public Mono<ApiResponse<Event>> unpublishEvent(@PathVariable @Min(1) Long eventId) {
        return eventService.unpublishEvent(eventId)
                .map(event -> new ApiResponse<>("Event unpublished successfully", event));
    }

    @GetMapping("/upcoming")
    public Mono<ApiResponse<PaginatedResponse<Event>>> getUpcomingEvents(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return eventService.getUpcomingEvents(page, limit)
                .map(events -> new ApiResponse<>("Upcoming events retrieved successfully", events));
    }

    @GetMapping("/past")
    public Mono<ApiResponse<PaginatedResponse<Event>>> getPastEvents(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return eventService.getPastEvents(page, limit)
                .map(events -> new ApiResponse<>("Past events retrieved successfully", events));
    }

    @GetMapping("/search")
    public Mono<ApiResponse<PaginatedResponse<Event>>> searchEvents(
            @RequestParam @NotBlank String keyword,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return eventService.searchEvents(keyword, page, limit)
                .map(events -> new ApiResponse<>("Search results retrieved successfully", events));
    }

    @PostMapping("/{eventId}/interest")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ApiResponse<EventInterest>> addInterest(@PathVariable @Min(1) Long eventId) {
        return eventService.addInterest(eventId)
                .map(interest -> new ApiResponse<>("Interest added successfully", interest));
    }

    @DeleteMapping("/{eventId}/interest")
    public Mono<ApiResponse<Void>> removeInterest(@PathVariable @Min(1) Long eventId) {
        return eventService.removeInterest(eventId)
                .map(removed -> new ApiResponse<>("Interest removed successfully", null));
    }

    @GetMapping("/{eventId}/interest/check")
    public Mono<ApiResponse<InterestCheckResponse>> checkInterest(@PathVariable @Min(1) Long eventId) {
        return eventService.checkInterest(eventId)
                .map(isInterested -> new ApiResponse<>("Interest status retrieved",
                        InterestCheckResponse.builder().isInterested(isInterested).build()));
    }

    @GetMapping("/{eventId}/interests")
    public Mono<ApiResponse<PaginatedResponse<EventInterest>>> getEventInterests(
            @PathVariable @Min(1) Long eventId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return eventService.getEventInterests(eventId, page, limit)
                .map(interests -> new ApiResponse<>("Event interests retrieved successfully", interests));
    }

    @PostMapping("/{eventId}/register")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ApiResponse<EventTicket>> registerForEvent(
            @PathVariable @Min(1) Long eventId,
            @Valid @RequestBody(required = false) RegisterTicketRequest request) {
        EventTicket ticket = EventTicket.builder()
                .guestName(request != null ? request.getGuestName() : null)
                .guestEmail(request != null ? request.getGuestEmail() : null)
                .guestPhone(request != null ? request.getGuestPhone() : null)
                .build();

        return eventService.registerForEvent(eventId, ticket)
                .map(registeredTicket -> new ApiResponse<>("Registered successfully", registeredTicket));
    }

    @PostMapping("/tickets/{ticketCode}/cancel")
    public Mono<ApiResponse<EventTicket>> cancelTicket(@PathVariable @NotBlank String ticketCode) {
        return eventService.cancelTicket(ticketCode)
                .map(ticket -> new ApiResponse<>("Ticket cancelled successfully", ticket));
    }

    @PostMapping("/tickets/{ticketCode}/check-in")
    public Mono<ApiResponse<EventTicket>> checkInTicket(@PathVariable @NotBlank String ticketCode) {
        return eventService.checkInTicket(ticketCode)
                .map(ticket -> new ApiResponse<>("Checked in successfully", ticket));
    }

    @GetMapping("/tickets/code/{ticketCode}")
    public Mono<ApiResponse<EventTicket>> getTicketByCode(@PathVariable @NotBlank String ticketCode) {
        return eventService.getTicketByCode(ticketCode)
                .map(ticket -> new ApiResponse<>("Ticket retrieved successfully", ticket));
    }

    @GetMapping("/{eventId}/tickets")
    public Mono<ApiResponse<PaginatedResponse<EventTicket>>> getTicketsByEvent(
            @PathVariable @Min(1) Long eventId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return eventService.getTicketsByEvent(eventId, page, limit)
                .map(tickets -> new ApiResponse<>("Event tickets retrieved successfully", tickets));
    }

    @GetMapping("/my-tickets")
    public Mono<ApiResponse<PaginatedResponse<EventTicket>>> getMyTickets(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return eventService.getMyTickets(page, limit)
                .map(tickets -> new ApiResponse<>("My tickets retrieved successfully", tickets));
    }

    @GetMapping("/{eventId}/statistics")
    public Mono<ApiResponse<EventStatisticsResponse>> getEventStatistics(@PathVariable @Min(1) Long eventId) {
        return eventService.getEventStatistics(eventId)
                .map(stats -> new ApiResponse<>("Event statistics retrieved successfully", stats));
    }
}
