package com.service.backend.admin.controller;

import com.service.backend.admin.dto.EventStatisticsDTO;
import com.service.backend.admin.service.AdminEventService;
import com.service.backend.event.dto.UpdateEventRequest;
import com.service.backend.shared.entity.Event;
import com.service.backend.shared.entity.EventInterest;
import com.service.backend.shared.entity.EventTicket;
import com.service.backend.shared.dto.ApiResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
import com.service.backend.shared.utils.SecurityUtils;
import reactor.core.publisher.Mono;

@Tag(name = "Admin > Events", description = "API endpoints for managing events by administrators")
@RestController
@RequestMapping("/api/admin/events")
@Validated
@PreAuthorize("hasAnyRole('ADMIN','STAFF')")
public class AdminEventController {

    private final AdminEventService adminEventService;

    public AdminEventController(AdminEventService adminEventService) {
        this.adminEventService = adminEventService;
    }

    @Operation(summary = "List all events, optionally filtered by organization (paginated)")
    @GetMapping
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<Event>>>> getAllEvents(
            @RequestParam(required = false) Long organizationId,
            @Parameter(example = "0")
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "Page must be at least 0") int page,
            @Parameter(example = "10")
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "Size must be at least 1") int size) {
        Integer orgIdInt = organizationId != null ? organizationId.intValue() : null;
        return SecurityUtils.resolveOrganizationId(orgIdInt)
                .flatMap(resolvedOrgId -> adminEventService.getAllEvents(resolvedOrgId.longValue(), page, size))
                .switchIfEmpty(adminEventService.getAllEvents(null, page, size))
                .map(paginated -> ResponseEntity.ok(new ApiResponse<>("Retrieved all events", paginated)));
    }

    @Operation(summary = "Search all events by keyword, optionally filtered by organization")
    @GetMapping("/search")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<Event>>>> searchAllEvents(
            @Parameter(example = "Hội thảo AI")
            @RequestParam @NotBlank(message = "Keyword is required") String keyword,
            @RequestParam(required = false) Long organizationId,
            @Parameter(example = "0")
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "Page must be at least 0") int page,
            @Parameter(example = "10")
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "Size must be at least 1") int size) {
        Integer orgIdInt = organizationId != null ? organizationId.intValue() : null;
        return SecurityUtils.resolveOrganizationId(orgIdInt)
                .flatMap(resolvedOrgId -> adminEventService.searchAllEvents(resolvedOrgId.longValue(), keyword, page, size))
                .switchIfEmpty(adminEventService.searchAllEvents(null, keyword, page, size))
                .map(paginated -> ResponseEntity.ok(new ApiResponse<>("Search results retrieved", paginated)));
    }

    @Operation(summary = "Filter events by publish status, optionally filtered by organization")
    @GetMapping("/by-status")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<Event>>>> getEventsByPublishStatus(
            @Parameter(example = "true")
            @RequestParam Boolean isPublished,
            @RequestParam(required = false) Long organizationId,
            @Parameter(example = "0")
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "Page must be at least 0") int page,
            @Parameter(example = "10")
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "Size must be at least 1") int size) {
        Integer orgIdInt = organizationId != null ? organizationId.intValue() : null;
        return SecurityUtils.resolveOrganizationId(orgIdInt)
                .flatMap(resolvedOrgId -> adminEventService.getEventsByPublishStatus(resolvedOrgId.longValue(), isPublished, page, size))
                .switchIfEmpty(adminEventService.getEventsByPublishStatus(null, isPublished, page, size))
                .map(paginated -> ResponseEntity.ok(new ApiResponse<>("Retrieved events by publish status", paginated)));
    }

    @Operation(summary = "Get a single event by ID")
    @GetMapping("/{eventId}")
    public Mono<ResponseEntity<ApiResponse<Event>>> getEventById(
            @PathVariable @Min(value = 1, message = "Event ID must be greater than 0") Long eventId) {
        return adminEventService.getEventById(eventId)
                .map(event -> ResponseEntity.ok(new ApiResponse<>("Retrieved event", event)));
    }


    @Operation(summary = "Update an event (admin override)")
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{eventId}")
    public Mono<ResponseEntity<ApiResponse<Event>>> updateEvent(
            @PathVariable @Min(value = 1, message = "Event ID must be greater than 0") Long eventId,
            @Valid @RequestBody UpdateEventRequest request) {
        return adminEventService.updateEvent(eventId, request)
                .map(event -> ResponseEntity.ok(new ApiResponse<>("Event updated successfully", event)));
    }

    @Operation(summary = "Delete an event (admin override)")
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{eventId}")
    public Mono<ResponseEntity<ApiResponse<Void>>> deleteEvent(
            @PathVariable @Min(value = 1, message = "Event ID must be greater than 0") Long eventId) {
        return adminEventService.deleteEvent(eventId)
                .thenReturn(ResponseEntity.ok(new ApiResponse<Void>("Event deleted successfully", null)));
    }

    @Operation(summary = "Publish an event")
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{eventId}/publish")
    public Mono<ResponseEntity<ApiResponse<Event>>> publishEvent(
            @PathVariable @Min(value = 1, message = "Event ID must be greater than 0") Long eventId) {
        return adminEventService.publishEvent(eventId)
                .map(event -> ResponseEntity.ok(new ApiResponse<>("Event published successfully", event)));
    }

    @Operation(summary = "Unpublish an event")
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{eventId}/unpublish")
    public Mono<ResponseEntity<ApiResponse<Event>>> unpublishEvent(
            @PathVariable @Min(value = 1, message = "Event ID must be greater than 0") Long eventId) {
        return adminEventService.unpublishEvent(eventId)
                .map(event -> ResponseEntity.ok(new ApiResponse<>("Event unpublished successfully", event)));
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
                .map(paginated -> ResponseEntity.ok(new ApiResponse<>("Retrieved event tickets", paginated)));
    }

    @Operation(summary = "Cancel a ticket by code (admin override)")
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/tickets/{ticketCode}/cancel")
    public Mono<ResponseEntity<ApiResponse<EventTicket>>> cancelTicket(
            @Parameter(example = "EVT2026-001")
            @PathVariable @NotBlank(message = "Ticket code is required") String ticketCode) {
        return adminEventService.cancelTicket(ticketCode)
                .map(ticket -> ResponseEntity.ok(new ApiResponse<>("Ticket cancelled successfully", ticket)));
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
                .map(paginated -> ResponseEntity.ok(new ApiResponse<>("Retrieved event interests", paginated)));
    }

    @Operation(summary = "Get comprehensive admin event statistics",
            description = "Returns overall event counts, publish status, time-based buckets, ticket counts, and top events by registration/interest.")
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/statistics")
    public Mono<ResponseEntity<ApiResponse<EventStatisticsDTO>>> getEventStatistics() {
        return adminEventService.getEventStatistics()
                .map(stats -> ResponseEntity.ok(new ApiResponse<>("Retrieved comprehensive event statistics", stats)));
    }
}
