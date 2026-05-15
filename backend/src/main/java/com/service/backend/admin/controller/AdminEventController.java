package com.service.backend.admin.controller;

import com.service.backend.admin.dto.EventStatisticsDTO;
import com.service.backend.admin.service.AdminEventService;
import com.service.backend.event.dto.UpdateEventRequest;
import com.service.backend.event.entity.Event;
import com.service.backend.event.entity.EventInterest;
import com.service.backend.event.entity.EventTicket;
import com.service.backend.shared.dto.ApiResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/admin/events")
@Validated
@Tag(name = "Admin Event Management", description = "Admin APIs for cross-organization event moderation and management")
public class AdminEventController {

    private final AdminEventService adminEventService;

    public AdminEventController(AdminEventService adminEventService) {
        this.adminEventService = adminEventService;
    }

    @Operation(summary = "List all events across organizations (paginated)")
    @GetMapping
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<Event>>>> getAllEvents(
            @Parameter(example = "0")
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "Page must be at least 0") int page,
            @Parameter(example = "10")
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "Size must be at least 1") int size) {
        return adminEventService.getAllEvents(page, size)
                .map(paginated -> ResponseEntity.ok(new ApiResponse<>("Retrieved all events", paginated)))
                .onErrorResume(this::handleError);
    }

    @Operation(summary = "List events by organization (paginated)")
    @GetMapping("/organization/{organizationId}")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<Event>>>> getEventsByOrganization(
            @PathVariable @Min(value = 1, message = "Organization ID must be greater than 0") Long organizationId,
            @Parameter(example = "0")
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "Page must be at least 0") int page,
            @Parameter(example = "10")
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "Size must be at least 1") int size) {
        return adminEventService.getEventsByOrganization(organizationId, page, size)
                .map(paginated -> ResponseEntity.ok(new ApiResponse<>("Retrieved events for organization", paginated)))
                .onErrorResume(this::handleError);
    }

    @Operation(summary = "Search all events by keyword")
    @GetMapping("/search")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<Event>>>> searchAllEvents(
            @Parameter(example = "Hội thảo AI")
            @RequestParam @NotBlank(message = "Keyword is required") String keyword,
            @Parameter(example = "0")
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "Page must be at least 0") int page,
            @Parameter(example = "10")
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "Size must be at least 1") int size) {
        return adminEventService.searchAllEvents(keyword, page, size)
                .map(paginated -> ResponseEntity.ok(new ApiResponse<>("Search results retrieved", paginated)))
                .onErrorResume(this::handleError);
    }

    @Operation(summary = "Filter events by publish status")
    @GetMapping("/by-status")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<Event>>>> getEventsByPublishStatus(
            @Parameter(example = "true")
            @RequestParam Boolean isPublished,
            @Parameter(example = "0")
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "Page must be at least 0") int page,
            @Parameter(example = "10")
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "Size must be at least 1") int size) {
        return adminEventService.getEventsByPublishStatus(isPublished, page, size)
                .map(paginated -> ResponseEntity.ok(new ApiResponse<>("Retrieved events by publish status", paginated)))
                .onErrorResume(this::handleError);
    }

    @Operation(summary = "Get a single event by ID")
    @GetMapping("/{eventId}")
    public Mono<ResponseEntity<ApiResponse<Event>>> getEventById(
            @PathVariable @Min(value = 1, message = "Event ID must be greater than 0") Long eventId) {
        return adminEventService.getEventById(eventId)
                .map(event -> ResponseEntity.ok(new ApiResponse<>("Retrieved event", event)))
                .onErrorResume(this::handleError);
    }


    @Operation(summary = "Update an event (admin override)")
    @PutMapping("/{eventId}")
    public Mono<ResponseEntity<ApiResponse<Event>>> updateEvent(
            @PathVariable @Min(value = 1, message = "Event ID must be greater than 0") Long eventId,
            @Valid @RequestBody UpdateEventRequest request) {
        return adminEventService.updateEvent(eventId, request)
                .map(event -> ResponseEntity.ok(new ApiResponse<>("Event updated successfully", event)))
                .onErrorResume(this::handleError);
    }

    @Operation(summary = "Delete an event (admin override)")
    @DeleteMapping("/{eventId}")
    public Mono<ResponseEntity<ApiResponse<Void>>> deleteEvent(
            @PathVariable @Min(value = 1, message = "Event ID must be greater than 0") Long eventId) {
        return adminEventService.deleteEvent(eventId)
                .then(Mono.just(ResponseEntity.ok(new ApiResponse<Void>("Event deleted successfully", null))))
                .onErrorResume(this::handleError);
    }

    @Operation(summary = "Publish an event")
    @PostMapping("/{eventId}/publish")
    public Mono<ResponseEntity<ApiResponse<Event>>> publishEvent(
            @PathVariable @Min(value = 1, message = "Event ID must be greater than 0") Long eventId) {
        return adminEventService.publishEvent(eventId)
                .map(event -> ResponseEntity.ok(new ApiResponse<>("Event published successfully", event)))
                .onErrorResume(this::handleError);
    }

    @Operation(summary = "Unpublish an event")
    @PostMapping("/{eventId}/unpublish")
    public Mono<ResponseEntity<ApiResponse<Event>>> unpublishEvent(
            @PathVariable @Min(value = 1, message = "Event ID must be greater than 0") Long eventId) {
        return adminEventService.unpublishEvent(eventId)
                .map(event -> ResponseEntity.ok(new ApiResponse<>("Event unpublished successfully", event)))
                .onErrorResume(this::handleError);
    }

    @Operation(summary = "List tickets registered for an event")
    @GetMapping("/{eventId}/tickets")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<EventTicket>>>> getTicketsByEvent(
            @PathVariable @Min(value = 1, message = "Event ID must be greater than 0") Long eventId,
            @Parameter(example = "0")
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "Page must be at least 0") int page,
            @Parameter(example = "10")
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "Size must be at least 1") int size) {
        return adminEventService.getTicketsByEvent(eventId, page, size)
                .map(paginated -> ResponseEntity.ok(new ApiResponse<>("Retrieved event tickets", paginated)))
                .onErrorResume(this::handleError);
    }

    @Operation(summary = "Cancel a ticket by code (admin override)")
    @PostMapping("/tickets/{ticketCode}/cancel")
    public Mono<ResponseEntity<ApiResponse<EventTicket>>> cancelTicket(
            @Parameter(example = "EVT2026-001")
            @PathVariable @NotBlank(message = "Ticket code is required") String ticketCode) {
        return adminEventService.cancelTicket(ticketCode)
                .map(ticket -> ResponseEntity.ok(new ApiResponse<>("Ticket cancelled successfully", ticket)))
                .onErrorResume(this::handleError);
    }

    @Operation(summary = "List interests recorded for an event")
    @GetMapping("/{eventId}/interests")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<EventInterest>>>> getInterestsByEvent(
            @PathVariable @Min(value = 1, message = "Event ID must be greater than 0") Long eventId,
            @Parameter(example = "0")
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "Page must be at least 0") int page,
            @Parameter(example = "10")
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "Size must be at least 1") int size) {
        return adminEventService.getInterestsByEvent(eventId, page, size)
                .map(paginated -> ResponseEntity.ok(new ApiResponse<>("Retrieved event interests", paginated)))
                .onErrorResume(this::handleError);
    }

    @Operation(summary = "Get comprehensive admin event statistics",
            description = "Returns overall event counts, publish status, time-based buckets, ticket counts, and top events by registration/interest.")
    @GetMapping("/statistics")
    public Mono<ResponseEntity<ApiResponse<EventStatisticsDTO>>> getEventStatistics() {
        return adminEventService.getEventStatistics()
                .map(stats -> ResponseEntity.ok(new ApiResponse<>("Retrieved comprehensive event statistics", stats)))
                .onErrorResume(this::handleError);
    }

    private <T> Mono<ResponseEntity<ApiResponse<T>>> handleError(Throwable error) {
        return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>(error.getMessage(), null)));
    }
}
