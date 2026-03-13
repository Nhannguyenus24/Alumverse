package com.service.backend.admin.controller;

import com.service.backend.admin.service.AdminEventService;
import com.service.backend.eventmodule.domain.entity.Event;
import com.service.backend.eventmodule.domain.entity.EventInterest;
import com.service.backend.eventmodule.domain.entity.EventTicket;
import com.service.backend.eventmodule.presentation.dto.request.CreateEventRequest;
import com.service.backend.eventmodule.presentation.dto.request.UpdateEventRequest;
import com.service.backend.eventmodule.presentation.dto.response.EventStatisticsResponse;
import com.service.backend.eventmodule.presentation.dto.response.PaginatedResponse;
import com.service.backend.shared.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;

@RestController
@RequestMapping("/api/admin/events")
@RequiredArgsConstructor
@Validated
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Event Management", description = "Admin endpoints for managing events system-wide")
public class AdminEventController {

    private final AdminEventService adminEventService;

    /**
     * Get all events in the system (admin access)
     */
    @GetMapping
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<Event>>>> getAllEvents(
            @Parameter(example = "0")
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @Parameter(example = "10")
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return adminEventService.getAllEvents(page, limit)
                .map(events -> ResponseEntity
                        .ok(new ApiResponse<>("All events retrieved successfully", events)));
    }

    /**
     * Get detailed event information
     */
    @GetMapping("/{eventId}")
    public Mono<ResponseEntity<ApiResponse<Event>>> getEventDetails(
            @Parameter(example = "100")
            @PathVariable @Min(1) Long eventId) {
        return adminEventService.getEventDetails(eventId)
                .map(event -> ResponseEntity
                        .ok(new ApiResponse<>("Event details retrieved successfully", event)));
    }

    /**
     * Create a new event (admin)
     */
    @PostMapping
    public Mono<ResponseEntity<ApiResponse<Event>>> createEvent(
            @Valid @RequestBody CreateEventRequest request) {
        return adminEventService.createEvent(request)
                .map(createdEvent -> ResponseEntity
                        .status(HttpStatus.CREATED)
                        .body(new ApiResponse<>("Event created successfully by admin", createdEvent)));
    }

    /**
     * Update event details (admin)
     */
    @PutMapping("/{eventId}")
    public Mono<ResponseEntity<ApiResponse<Event>>> updateEvent(
            @Parameter(example = "100")
            @PathVariable @Min(1) Long eventId,
            @Valid @RequestBody UpdateEventRequest request) {
        return adminEventService.updateEvent(eventId, request)
                .map(updatedEvent -> ResponseEntity
                        .ok(new ApiResponse<>("Event updated successfully by admin", updatedEvent)));
    }

    /**
     * Delete an event (admin)
     */
    @DeleteMapping("/{eventId}")
    public Mono<ResponseEntity<ApiResponse<Void>>> deleteEvent(
            @Parameter(example = "100")
            @PathVariable @Min(1) Long eventId) {
        return adminEventService.deleteEvent(eventId)
                .map(deleted -> ResponseEntity
                        .ok(new ApiResponse<>("Event deleted successfully by admin", null)));
    }

    /**
     * Publish event to public (admin)
     */
    @PostMapping("/{eventId}/publish")
    public Mono<ResponseEntity<ApiResponse<Event>>> publishEvent(
            @Parameter(example = "100")
            @PathVariable @Min(1) Long eventId) {
        return adminEventService.publishEvent(eventId)
                .map(event -> ResponseEntity
                        .ok(new ApiResponse<>("Event published successfully by admin", event)));
    }

    /**
     * Unpublish event from public (admin)
     */
    @PostMapping("/{eventId}/unpublish")
    public Mono<ResponseEntity<ApiResponse<Event>>> unpublishEvent(
            @Parameter(example = "100")
            @PathVariable @Min(1) Long eventId) {
        return adminEventService.unpublishEvent(eventId)
                .map(event -> ResponseEntity
                        .ok(new ApiResponse<>("Event unpublished successfully by admin", event)));
    }

    /**
     * Get upcoming events (admin view)
     */
    @GetMapping("/upcoming")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<Event>>>> getUpcomingEvents(
            @Parameter(example = "0")
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @Parameter(example = "10")
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return adminEventService.getUpcomingEvents(page, limit)
                .map(events -> ResponseEntity
                        .ok(new ApiResponse<>("Upcoming events retrieved successfully", events)));
    }

    /**
     * Get past events (admin view)
     */
    @GetMapping("/past")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<Event>>>> getPastEvents(
            @Parameter(example = "0")
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @Parameter(example = "10")
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return adminEventService.getPastEvents(page, limit)
                .map(events -> ResponseEntity
                        .ok(new ApiResponse<>("Past events retrieved successfully", events)));
    }

    /**
     * Search events system-wide (admin)
     */
    @GetMapping("/search")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<Event>>>> searchEvents(
            @Parameter(example = "Hội thảo AI 2026")
            @RequestParam @NotBlank String keyword,
            @Parameter(example = "0")
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @Parameter(example = "10")
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return adminEventService.searchEvents(keyword, page, limit)
                .map(events -> ResponseEntity
                        .ok(new ApiResponse<>("Search results retrieved successfully", events)));
    }

    /**
     * Get event statistics (admin - detailed view)
     */
    @GetMapping("/{eventId}/statistics")
    public Mono<ResponseEntity<ApiResponse<EventStatisticsResponse>>> getEventStatistics(
            @Parameter(example = "100")
            @PathVariable @Min(1) Long eventId) {
        return adminEventService.getEventStatistics(eventId)
                .map(stats -> ResponseEntity
                        .ok(new ApiResponse<>("Event statistics retrieved successfully", stats)));
    }

    /**
     * Get all user interests for an event (admin)
     */
    @GetMapping("/{eventId}/interests")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<EventInterest>>>> getEventInterests(
            @Parameter(example = "100")
            @PathVariable @Min(1) Long eventId,
            @Parameter(example = "0")
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @Parameter(example = "10")
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return adminEventService.getEventInterests(eventId, page, limit)
                .map(interests -> ResponseEntity
                        .ok(new ApiResponse<>("Event interests retrieved successfully", interests)));
    }

    /**
     * Get all tickets for an event (admin)
     */
    @GetMapping("/{eventId}/tickets")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<EventTicket>>>> getEventTickets(
            @Parameter(example = "100")
            @PathVariable @Min(1) Long eventId,
            @Parameter(example = "0")
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @Parameter(example = "10")
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return adminEventService.getTicketsByEvent(eventId, page, limit)
                .map(tickets -> ResponseEntity
                        .ok(new ApiResponse<>("Event tickets retrieved successfully", tickets)));
    }

    /**
     * Get ticket details by code (admin)
     */
    @GetMapping("/tickets/code/{ticketCode}")
    public Mono<ResponseEntity<ApiResponse<EventTicket>>> getTicketByCode(
            @Parameter(example = "EVT2026-001")
            @PathVariable @NotBlank String ticketCode) {
        return adminEventService.getTicketByCode(ticketCode)
                .map(ticket -> ResponseEntity
                        .ok(new ApiResponse<>("Ticket retrieved successfully", ticket)));
    }

    /**
     * Cancel ticket registration (admin)
     */
    @PostMapping("/tickets/{ticketCode}/cancel")
    public Mono<ResponseEntity<ApiResponse<EventTicket>>> cancelTicket(
            @Parameter(example = "EVT2026-001")
            @PathVariable @NotBlank String ticketCode,
            @RequestParam(required = false) String reason) {
        return adminEventService.cancelTicket(ticketCode)
                .map(ticket -> ResponseEntity
                        .ok(new ApiResponse<>("Ticket cancelled successfully by admin. Reason: " + reason, ticket)));
    }

    /**
     * Perform check-in for a ticket (admin)
     */
    @PostMapping("/tickets/{ticketCode}/check-in")
    public Mono<ResponseEntity<ApiResponse<EventTicket>>> checkInTicket(
            @Parameter(example = "EVT2026-001")
            @PathVariable @NotBlank String ticketCode) {
        return adminEventService.checkInTicket(ticketCode)
                .map(ticket -> ResponseEntity
                        .ok(new ApiResponse<>("Ticket checked in successfully by admin", ticket)));
    }

    /**
     * Remove user interest from event (admin)
     */
    @DeleteMapping("/{eventId}/interests/{userId}")
    public Mono<ResponseEntity<ApiResponse<Void>>> removeUserInterest(
            @Parameter(example = "100")
            @PathVariable @Min(1) Long eventId,
            @Parameter(example = "1")
            @PathVariable @Min(1) Long userId) {
        return adminEventService.removeUserInterest(eventId, userId)
                .map(removed -> ResponseEntity
                        .ok(new ApiResponse<>("User interest removed successfully by admin", null)));
    }

    /**
     * Bulk action for publishing events (admin)
     */
    @PostMapping("/bulk/publish")
    public Mono<ResponseEntity<ApiResponse<Object>>> bulkPublishEvents(
            @RequestBody List<Long> eventIds) {
        return adminEventService.bulkPublishEvents(eventIds)
                .map(result -> ResponseEntity
                        .ok(new ApiResponse<>("Events published in bulk successfully", result)));
    }

    /**
     * Bulk action to unpublish events (admin)
     */
    @PostMapping("/bulk/unpublish")
    public Mono<ResponseEntity<ApiResponse<Object>>> bulkUnpublishEvents(
            @RequestBody List<Long> eventIds) {
        return adminEventService.bulkUnpublishEvents(eventIds)
                .map(result -> ResponseEntity
                        .ok(new ApiResponse<>("Events unpublished in bulk successfully", result)));
    }

    /**
     * Bulk action to delete events (admin)
     */
    @PostMapping("/bulk/delete")
    public Mono<ResponseEntity<ApiResponse<Object>>> bulkDeleteEvents(
            @RequestBody List<Long> eventIds) {
        return adminEventService.bulkDeleteEvents(eventIds)
                .map(result -> ResponseEntity
                        .ok(new ApiResponse<>("Events deleted in bulk successfully", result)));
    }
}
