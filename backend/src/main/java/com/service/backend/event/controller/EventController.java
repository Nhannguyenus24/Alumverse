package com.service.backend.event.controller;

import com.service.backend.shared.entity.Event;
import com.service.backend.shared.entity.EventInterest;
import com.service.backend.shared.entity.EventTicket;
import com.service.backend.event.dto.CreateEventRequest;
import com.service.backend.event.dto.RegisterTicketRequest;
import com.service.backend.event.dto.UpdateEventRequest;
import com.service.backend.event.dto.EventStatisticsResponse;
import com.service.backend.event.dto.InterestCheckResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.event.service.EventService;
import com.service.backend.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;
import io.swagger.v3.oas.annotations.Parameter;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
@Validated
public class EventController {

    private final EventService eventService;

    @PostMapping
    public Mono<ResponseEntity<ApiResponse<Event>>> createEvent(@Valid @RequestBody CreateEventRequest request) {
        return eventService.createEvent(request)
                .map(createdEvent -> ResponseEntity
                        .status(HttpStatus.CREATED)
                        .body(new ApiResponse<>("Event created successfully", createdEvent)));
    }

    @PutMapping("/{eventId}")
    public Mono<ResponseEntity<ApiResponse<Event>>> updateEvent(
            @Parameter(example = "100")
            @PathVariable @Min(1) Long eventId,
            @Valid @RequestBody UpdateEventRequest request) {
        return eventService.updateEvent(eventId, request)
                .map(updatedEvent -> ResponseEntity
                        .ok(new ApiResponse<>("Event updated successfully", updatedEvent)));
    }

    @DeleteMapping("/{eventId}")
    public Mono<ResponseEntity<ApiResponse<Void>>> deleteEvent(
            @Parameter(example = "100")
            @PathVariable @Min(1) Long eventId) {
        return eventService.deleteEvent(eventId)
                .map(deleted -> ResponseEntity
                        .ok(new ApiResponse<>("Event deleted successfully", null)));
    }

    @GetMapping("/{eventId}")
    public Mono<ResponseEntity<ApiResponse<Event>>> getEventById(
            @Parameter(example = "100")
            @PathVariable @Min(1) Long eventId) {
        return eventService.getEventById(eventId)
                .map(event -> ResponseEntity
                        .ok(new ApiResponse<>("Event retrieved successfully", event)));
    }

    @GetMapping
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<Event>>>> getEvents(
            @Parameter(example = "0")
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @Parameter(example = "10")
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return eventService.getEventsByOrganization(page, limit)
                .map(events -> ResponseEntity
                        .ok(new ApiResponse<>("Events retrieved successfully", events)));
    }

    @PostMapping("/{eventId}/publish")
    public Mono<ResponseEntity<ApiResponse<Event>>> publishEvent(
            @Parameter(example = "100")
            @PathVariable @Min(1) Long eventId) {
        return eventService.publishEvent(eventId)
                .map(event -> ResponseEntity
                        .ok(new ApiResponse<>("Event published successfully", event)));
    }

    @PostMapping("/{eventId}/unpublish")
    public Mono<ResponseEntity<ApiResponse<Event>>> unpublishEvent(
            @Parameter(example = "100")
            @PathVariable @Min(1) Long eventId) {
        return eventService.unpublishEvent(eventId)
                .map(event -> ResponseEntity
                        .ok(new ApiResponse<>("Event unpublished successfully", event)));
    }

    @GetMapping("/upcoming")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<Event>>>> getUpcomingEvents(
            @Parameter(example = "0")
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @Parameter(example = "10")
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return eventService.getUpcomingEvents(page, limit)
                .map(events -> ResponseEntity
                        .ok(new ApiResponse<>("Upcoming events retrieved successfully", events)));
    }

    @GetMapping("/past")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<Event>>>> getPastEvents(
            @Parameter(example = "0")
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @Parameter(example = "10")
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return eventService.getPastEvents(page, limit)
                .map(events -> ResponseEntity
                        .ok(new ApiResponse<>("Past events retrieved successfully", events)));
    }

    @GetMapping("/search")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<Event>>>> searchEvents(
            @Parameter(example = "Hội thảo AI 2026")
            @RequestParam @NotBlank String keyword,
            @Parameter(example = "0")
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @Parameter(example = "10")
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return eventService.searchEvents(keyword, page, limit)
                .map(events -> ResponseEntity
                        .ok(new ApiResponse<>("Search results retrieved successfully", events)));
    }

    @PostMapping("/{eventId}/interest")
    public Mono<ResponseEntity<ApiResponse<EventInterest>>> addInterest(
            @Parameter(example = "100")
            @PathVariable @Min(1) Long eventId) {
        return eventService.addInterest(eventId)
                .map(interest -> ResponseEntity
                        .status(HttpStatus.CREATED)
                        .body(new ApiResponse<>("Interest added successfully", interest)));
    }

    @DeleteMapping("/{eventId}/interest")
    public Mono<ResponseEntity<ApiResponse<Void>>> removeInterest(
            @Parameter(example = "100")
            @PathVariable @Min(1) Long eventId) {
        return eventService.removeInterest(eventId)
                .map(removed -> ResponseEntity
                        .ok(new ApiResponse<>("Interest removed successfully", null)));
    }

    @GetMapping("/{eventId}/interest/check")
    public Mono<ResponseEntity<ApiResponse<InterestCheckResponse>>> checkInterest(
            @Parameter(example = "100")
            @PathVariable @Min(1) Long eventId) {
        return eventService.checkInterest(eventId)
                .map(isInterested -> ResponseEntity
                        .ok(new ApiResponse<>("Interest status retrieved",
                                InterestCheckResponse.builder().isInterested(isInterested).build())));
    }

    @GetMapping("/{eventId}/interests")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<EventInterest>>>> getEventInterests(
            @Parameter(example = "100")
            @PathVariable @Min(1) Long eventId,
            @Parameter(example = "0")
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @Parameter(example = "10")
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return eventService.getEventInterests(eventId, page, limit)
                .map(interests -> ResponseEntity
                        .ok(new ApiResponse<>("Event interests retrieved successfully", interests)));
    }

    @PostMapping("/{eventId}/register")
    public Mono<ResponseEntity<ApiResponse<EventTicket>>> registerForEvent(
            @Parameter(example = "100")
            @PathVariable @Min(1) Long eventId,
            @Valid @RequestBody(required = false) RegisterTicketRequest request) {
        return eventService.registerForEvent(eventId, request)
                .map(registeredTicket -> ResponseEntity
                        .status(HttpStatus.CREATED)
                        .body(new ApiResponse<>("Registered successfully", registeredTicket)));
    }

    @PostMapping("/tickets/{ticketCode}/cancel")
    public Mono<ResponseEntity<ApiResponse<EventTicket>>> cancelTicket(
            @Parameter(example = "EVT2026-001")
            @PathVariable @NotBlank String ticketCode) {
        return eventService.cancelTicket(ticketCode)
                .map(ticket -> ResponseEntity
                        .ok(new ApiResponse<>("Ticket cancelled successfully", ticket)));
    }

    @PostMapping("/tickets/{ticketCode}/check-in")
    public Mono<ResponseEntity<ApiResponse<EventTicket>>> checkInTicket(
            @Parameter(example = "EVT2026-001")
            @PathVariable @NotBlank String ticketCode) {
        return eventService.checkInTicket(ticketCode)
                .map(ticket -> ResponseEntity
                        .ok(new ApiResponse<>("Checked in successfully", ticket)));
    }

    @GetMapping("/tickets/code/{ticketCode}")
    public Mono<ResponseEntity<ApiResponse<EventTicket>>> getTicketByCode(
            @Parameter(example = "EVT2026-001")
            @PathVariable @NotBlank String ticketCode) {
        return eventService.getTicketByCode(ticketCode)
                .map(ticket -> ResponseEntity
                        .ok(new ApiResponse<>("Ticket retrieved successfully", ticket)));
    }

    @GetMapping("/{eventId}/tickets")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<EventTicket>>>> getTicketsByEvent(
            @Parameter(example = "100")
            @PathVariable @Min(1) Long eventId,
            @Parameter(example = "0")
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @Parameter(example = "10")
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return eventService.getTicketsByEvent(eventId, page, limit)
                .map(tickets -> ResponseEntity
                        .ok(new ApiResponse<>("Event tickets retrieved successfully", tickets)));
    }

    @GetMapping("/my-tickets")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<EventTicket>>>> getMyTickets(
            @Parameter(example = "0")
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @Parameter(example = "10")
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return eventService.getMyTickets(page, limit)
                .map(tickets -> ResponseEntity
                        .ok(new ApiResponse<>("My tickets retrieved successfully", tickets)));
    }

    @GetMapping("/{eventId}/statistics")
    public Mono<ResponseEntity<ApiResponse<EventStatisticsResponse>>> getEventStatistics(
            @Parameter(example = "100")
            @PathVariable @Min(1) Long eventId) {
        return eventService.getEventStatistics(eventId)
                .map(stats -> ResponseEntity
                        .ok(new ApiResponse<>("Event statistics retrieved successfully", stats)));
    }
}
