package com.service.backend.event.controller;

import com.service.backend.shared.entity.*;
import com.service.backend.event.dto.*;
import com.service.backend.shared.dto.ApiResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.event.service.EventService;
import com.service.backend.shared.annotations.PublicEndpoint;
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
import io.swagger.v3.oas.annotations.Parameter;
import java.util.Map;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Events", description = "API endpoints for viewing and joining events")
@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
@Validated
public class EventController {

    private final EventService eventService;

    // ─── Event CRUD ───────────────────────────────────────────────────────────

    @PostMapping
    public Mono<ResponseEntity<ApiResponse<Event>>> createEvent(@Valid @RequestBody CreateEventRequest request) {
        return eventService.createEvent(request)
                .map(e -> ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse<>("Event created successfully", e)));
    }

    @PutMapping("/{eventId}")
    public Mono<ResponseEntity<ApiResponse<Event>>> updateEvent(
            @Parameter(example = "1") @PathVariable @Min(1) Long eventId,
            @Valid @RequestBody UpdateEventRequest request) {
        return eventService.updateEvent(eventId, request)
                .map(e -> ResponseEntity.ok(new ApiResponse<>("Event updated successfully", e)));
    }

    @DeleteMapping("/{eventId}")
    public Mono<ResponseEntity<ApiResponse<Void>>> deleteEvent(
            @Parameter(example = "1") @PathVariable @Min(1) Long eventId) {
        return eventService.deleteEvent(eventId)
                .map(d -> ResponseEntity.ok(new ApiResponse<>("Event deleted successfully", (Void) null)));
    }

    @PublicEndpoint
    @GetMapping("/{eventId}")
    public Mono<ResponseEntity<ApiResponse<Event>>> getEventById(
            @Parameter(example = "1") @PathVariable @Min(1) Long eventId) {
        return eventService.getEventById(eventId)
                .map(e -> ResponseEntity.ok(new ApiResponse<>("Event retrieved successfully", e)));
    }

    @PublicEndpoint
    @GetMapping
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<Event>>>> getEvents(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return eventService.getEventsByOrganization(page, limit)
                .map(e -> ResponseEntity.ok(new ApiResponse<>("Events retrieved successfully", e)));
    }

    @PostMapping("/{eventId}/publish")
    public Mono<ResponseEntity<ApiResponse<Event>>> publishEvent(
            @Parameter(example = "1") @PathVariable @Min(1) Long eventId) {
        return eventService.publishEvent(eventId)
                .map(e -> ResponseEntity.ok(new ApiResponse<>("Event published successfully", e)));
    }

    @PostMapping("/{eventId}/unpublish")
    public Mono<ResponseEntity<ApiResponse<Event>>> unpublishEvent(
            @Parameter(example = "1") @PathVariable @Min(1) Long eventId) {
        return eventService.unpublishEvent(eventId)
                .map(e -> ResponseEntity.ok(new ApiResponse<>("Event unpublished successfully", e)));
    }

    @PublicEndpoint
    @GetMapping("/upcoming")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<Event>>>> getUpcomingEvents(
            @RequestParam(required = false) Long organizationId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        Mono<PaginatedResponse<Event>> result = organizationId != null
                ? eventService.getUpcomingEvents(organizationId, page, limit)
                : eventService.getUpcomingEvents(page, limit);
        return result.map(e -> ResponseEntity.ok(new ApiResponse<>("Upcoming events retrieved successfully", e)));
    }

    @PublicEndpoint
    @GetMapping("/past")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<Event>>>> getPastEvents(
            @RequestParam Long organizationId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return eventService.getPastEvents(organizationId, page, limit)
                .map(e -> ResponseEntity.ok(new ApiResponse<>("Past events retrieved successfully", e)));
    }

    @PublicEndpoint
    @GetMapping("/search")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<Event>>>> searchEvents(
            @RequestParam Long organizationId,
            @RequestParam @NotBlank String keyword,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return eventService.searchEvents(organizationId, keyword, page, limit)
                .map(e -> ResponseEntity.ok(new ApiResponse<>("Search results retrieved successfully", e)));
    }

    // ─── Interest ─────────────────────────────────────────────────────────────

    @PostMapping("/{eventId}/interest")
    public Mono<ResponseEntity<ApiResponse<EventInterest>>> addInterest(
            @Parameter(example = "1") @PathVariable @Min(1) Long eventId) {
        return eventService.addInterest(eventId)
                .map(i -> ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse<>("Interest added successfully", i)));
    }

    @DeleteMapping("/{eventId}/interest")
    public Mono<ResponseEntity<ApiResponse<Void>>> removeInterest(
            @Parameter(example = "1") @PathVariable @Min(1) Long eventId) {
        return eventService.removeInterest(eventId)
                .map(r -> ResponseEntity.ok(new ApiResponse<>("Interest removed successfully", (Void) null)));
    }

    @GetMapping("/{eventId}/interest/check")
    public Mono<ResponseEntity<ApiResponse<InterestCheckResponse>>> checkInterest(
            @Parameter(example = "1") @PathVariable @Min(1) Long eventId) {
        return eventService.checkInterest(eventId)
                .map(v -> ResponseEntity.ok(new ApiResponse<>("Interest status retrieved",
                        InterestCheckResponse.builder().isInterested(v).build())));
    }

    @GetMapping("/{eventId}/check-registered")
    public Mono<ResponseEntity<ApiResponse<Map<String, Boolean>>>> checkRegistered(
            @Parameter(example = "1") @PathVariable @Min(1) Long eventId) {
        return eventService.checkRegistered(eventId)
                .map(v -> ResponseEntity.ok(new ApiResponse<>("Registration status retrieved",
                        Map.of("isRegistered", v))));
    }

    @GetMapping("/{eventId}/interests")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<EventInterestDetailResponse>>>> getEventInterests(
            @Parameter(example = "1") @PathVariable @Min(1) Long eventId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return eventService.getEventInterests(eventId, page, limit)
                .map(i -> ResponseEntity.ok(new ApiResponse<>("Event interests retrieved successfully", i)));
    }

    // ─── Step 1: Invite users ─────────────────────────────────────────────────

    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @PostMapping("/{eventId}/invitations")
    public Mono<ResponseEntity<ApiResponse<Integer>>> inviteUsers(
            @Parameter(example = "1") @PathVariable @Min(1) Long eventId,
            @Valid @RequestBody InviteUsersRequest request) {
        return eventService.inviteUsers(eventId, request)
                .map(count -> ResponseEntity.status(HttpStatus.CREATED)
                        .body(new ApiResponse<>("Invitations sent: " + count, count)));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @GetMapping("/{eventId}/invitations")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<EventInvitationDetailResponse>>>> getInvitations(
            @Parameter(example = "1") @PathVariable @Min(1) Long eventId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return eventService.getInvitationsByEvent(eventId, page, limit)
                .map(i -> ResponseEntity.ok(new ApiResponse<>("Invitations retrieved successfully", i)));
    }

    // ─── Step 2.1: Confirm invitation ─────────────────────────────────────────

    @PostMapping("/invitations/confirm")
    public Mono<ResponseEntity<ApiResponse<EventTicket>>> confirmInvitation(
            @RequestParam @NotBlank String token) {
        return eventService.confirmInvitation(token)
                .map(t -> ResponseEntity.ok(new ApiResponse<>("Invitation confirmed, ticket issued", t)));
    }

    // ─── Step 2.2: Self-register ──────────────────────────────────────────────

    @PostMapping("/{eventId}/register")
    public Mono<ResponseEntity<ApiResponse<EventTicket>>> registerForEvent(
            @Parameter(example = "1") @PathVariable @Min(1) Long eventId,
            @Valid @RequestBody(required = false) RegisterTicketRequest request) {
        return eventService.registerForEvent(eventId, request)
                .map(t -> ResponseEntity.status(HttpStatus.CREATED)
                        .body(new ApiResponse<>("Registration successful, ticket issued", t)));
    }

    // ─── Step 3: Reminder emails ──────────────────────────────────────────────

    @PostMapping("/{eventId}/reminders")
    public Mono<ResponseEntity<ApiResponse<Integer>>> sendReminders(
            @Parameter(example = "1") @PathVariable @Min(1) Long eventId,
            @Valid @RequestBody ReminderEmailRequest request) {
        return eventService.sendReminderEmails(eventId, request)
                .map(count -> ResponseEntity.ok(new ApiResponse<>("Reminder sent to " + count + " recipients", count)));
    }

    @GetMapping("/{eventId}/email-logs")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<EventEmailLog>>>> getEmailLogs(
            @Parameter(example = "1") @PathVariable @Min(1) Long eventId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return eventService.getEmailLogsByEvent(eventId, page, limit)
                .map(logs -> ResponseEntity.ok(new ApiResponse<>("Email logs retrieved successfully", logs)));
    }

    // ─── Step 5: Send issued ticket emails ───────────────────────────────────

    @PostMapping("/{eventId}/tickets/send-emails")
    public Mono<ResponseEntity<ApiResponse<Integer>>> sendTicketEmails(
            @Parameter(example = "1") @PathVariable @Min(1) Long eventId) {
        return eventService.sendIssuedTicketEmails(eventId)
                .map(count -> ResponseEntity.ok(new ApiResponse<>("Ticket emails sent to " + count + " recipients", count)));
    }

    // ─── Step 6: Check-in (event-scoped, QR-encrypted, staff-only) ────────────

    @PostMapping("/{eventId}/tickets/check-in")
    public Mono<ResponseEntity<ApiResponse<EventTicketDetailResponse>>> checkIn(
            @Parameter(example = "1") @PathVariable @Min(1) Long eventId,
            @RequestBody(required = false) CheckInRequest request) {
        return eventService.checkIn(eventId, request)
                .map(t -> ResponseEntity.ok(new ApiResponse<>("Checked in successfully", t)));
    }

    // ─── Ticket queries ───────────────────────────────────────────────────────

    @PostMapping("/tickets/{ticketCode}/cancel")
    public Mono<ResponseEntity<ApiResponse<EventTicket>>> cancelTicket(
            @Parameter(example = "ABC12345") @PathVariable @NotBlank String ticketCode,
            @Valid @RequestBody CancelTicketRequest request) {
        return eventService.cancelTicket(ticketCode, request.getReason())
                .map(t -> ResponseEntity.ok(new ApiResponse<>("Ticket cancelled successfully", t)));
    }

    @GetMapping("/tickets/code/{ticketCode}")
    public Mono<ResponseEntity<ApiResponse<EventTicketDetailResponse>>> getTicketByCode(
            @Parameter(example = "ABC12345") @PathVariable @NotBlank String ticketCode) {
        return eventService.getTicketByCode(ticketCode)
                .map(t -> ResponseEntity.ok(new ApiResponse<>("Ticket retrieved successfully", t)));
    }

    @GetMapping("/{eventId}/tickets")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<EventTicketDetailResponse>>>> getTicketsByEvent(
            @Parameter(example = "1") @PathVariable @Min(1) Long eventId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return eventService.getTicketsByEvent(eventId, status, keyword, page, limit)
                .map(t -> ResponseEntity.ok(new ApiResponse<>("Event tickets retrieved successfully", t)));
    }

    @GetMapping("/my-tickets")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<EventTicketDetailResponse>>>> getMyTickets(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return eventService.getMyTickets(page, limit)
                .map(t -> ResponseEntity.ok(new ApiResponse<>("My tickets retrieved successfully", t)));
    }

    @GetMapping("/{eventId}/statistics")
    public Mono<ResponseEntity<ApiResponse<EventStatisticsResponse>>> getEventStatistics(
            @Parameter(example = "1") @PathVariable @Min(1) Long eventId) {
        return eventService.getEventStatistics(eventId)
                .map(s -> ResponseEntity.ok(new ApiResponse<>("Event statistics retrieved successfully", s)));
    }

    // ─── Event questions ──────────────────────────────────────────────────────

    @PublicEndpoint
    @GetMapping("/{eventId}/questions")
    public Mono<ResponseEntity<ApiResponse<java.util.List<EventQuestionResponse>>>> getEventQuestions(
            @Parameter(example = "1") @PathVariable @Min(1) Long eventId) {
        return eventService.getEventQuestions(eventId)
                .collectList()
                .map(list -> ResponseEntity.ok(new ApiResponse<>("Event questions retrieved successfully", list)));
    }

    @PostMapping("/{eventId}/questions")
    public Mono<ResponseEntity<ApiResponse<EventQuestionResponse>>> createEventQuestion(
            @Parameter(example = "1") @PathVariable @Min(1) Long eventId,
            @Valid @RequestBody EventQuestionRequest request) {
        return eventService.createEventQuestion(eventId, request)
                .map(q -> ResponseEntity.status(HttpStatus.CREATED)
                        .body(new ApiResponse<>("Question created successfully", q)));
    }

    @PutMapping("/{eventId}/questions/{questionId}")
    public Mono<ResponseEntity<ApiResponse<EventQuestionResponse>>> updateEventQuestion(
            @Parameter(example = "1") @PathVariable @Min(1) Long eventId,
            @PathVariable @Min(1) Integer questionId,
            @Valid @RequestBody EventQuestionRequest request) {
        return eventService.updateEventQuestion(eventId, questionId, request)
                .map(q -> ResponseEntity.ok(new ApiResponse<>("Question updated successfully", q)));
    }

    @DeleteMapping("/{eventId}/questions/{questionId}")
    public Mono<ResponseEntity<ApiResponse<Void>>> deleteEventQuestion(
            @Parameter(example = "1") @PathVariable @Min(1) Long eventId,
            @PathVariable @Min(1) Integer questionId) {
        return eventService.deleteEventQuestion(eventId, questionId)
                .map(ok -> ResponseEntity.ok(new ApiResponse<>("Question deleted successfully", (Void) null)));
    }

    @PutMapping("/{eventId}/questions/reorder")
    public Mono<ResponseEntity<ApiResponse<Void>>> reorderEventQuestions(
            @Parameter(example = "1") @PathVariable @Min(1) Long eventId,
            @Valid @RequestBody ReorderEventQuestionsRequest request) {
        return eventService.reorderEventQuestions(eventId, request)
                .map(ok -> ResponseEntity.ok(new ApiResponse<>("Questions reordered successfully", (Void) null)));
    }
}
