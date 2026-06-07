package com.service.backend.event.service;

import com.service.backend.shared.entity.*;
import com.service.backend.event.dao.IEventRepository;
import com.service.backend.event.dto.*;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.enums.Status;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.service.EmailService;
import com.service.backend.shared.service.ImageService;
import com.service.backend.shared.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EventService {

    private final IEventRepository eventRepository;
    private final ImageService imageService;
    private final EmailService emailService;

    // ─── Event CRUD ───────────────────────────────────────────────────────────

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
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found: " + eventId)))
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
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found: " + eventId)))
                .flatMap(e -> eventRepository.deleteEvent(eventId));
    }

    public Mono<Event> getEventById(Long eventId) {
        return eventRepository.findEventById(eventId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found: " + eventId)));
    }

    public Mono<PaginatedResponse<Event>> getEventsByOrganization(int page, int limit) {
        return SecurityUtils.getCurrentOrganizationId()
                .flatMap(orgId -> eventRepository.findEventsByOrganization(orgId.longValue(), page, limit));
    }

    public Mono<Event> publishEvent(Long eventId) {
        return eventRepository.findEventById(eventId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found: " + eventId)))
                .flatMap(e -> eventRepository.publishEvent(eventId));
    }

    public Mono<Event> unpublishEvent(Long eventId) {
        return eventRepository.findEventById(eventId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found: " + eventId)))
                .flatMap(e -> eventRepository.unpublishEvent(eventId));
    }

    public Mono<PaginatedResponse<Event>> getUpcomingEvents(Long organizationId, int page, int limit) {
        return eventRepository.findUpcomingEvents(organizationId, page, limit);
    }

    public Mono<PaginatedResponse<Event>> getPastEvents(Long organizationId, int page, int limit) {
        return eventRepository.findPastEvents(organizationId, page, limit);
    }

    public Mono<PaginatedResponse<Event>> searchEvents(Long organizationId, String keyword, int page, int limit) {
        return eventRepository.searchEvents(organizationId, keyword, page, limit);
    }

    // ─── Interest ─────────────────────────────────────────────────────────────

    public Mono<EventInterest> addInterest(Long eventId) {
        return SecurityUtils.getCurrentUserId().flatMap(memberId ->
                eventRepository.findEventById(eventId)
                        .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found: " + eventId)))
                        .flatMap(event -> eventRepository.checkUserInterest(eventId, memberId))
                        .flatMap(already -> {
                            if (already) return Mono.error(new ApplicationException(ErrorCode.ALREADY_INTERESTED, "Already interested"));
                            return eventRepository.addEventInterest(eventId, memberId);
                        }));
    }

    public Mono<Boolean> removeInterest(Long eventId) {
        return SecurityUtils.getCurrentUserId().flatMap(memberId ->
                eventRepository.findEventById(eventId)
                        .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found: " + eventId)))
                        .flatMap(e -> eventRepository.removeEventInterest(eventId, memberId)));
    }

    public Mono<Boolean> checkInterest(Long eventId) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(memberId -> eventRepository.checkUserInterest(eventId, memberId));
    }

    public Mono<Boolean> checkRegistered(Long eventId) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(memberId -> eventRepository.checkUserRegistered(eventId, memberId));
    }

    public Mono<PaginatedResponse<EventInterest>> getEventInterests(Long eventId, int page, int limit) {
        return eventRepository.findEventInterests(eventId, page, limit);
    }

    // ─── Step 1: Invite users ─────────────────────────────────────────────────

    public Mono<Integer> inviteUsers(Long eventId, InviteUsersRequest request) {
        return SecurityUtils.getCurrentUserId().flatMap(invitedBy ->
                eventRepository.findEventById(eventId)
                        .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found: " + eventId)))
                        .flatMap(event -> Flux.fromIterable(request.getInvitees())
                                .flatMap(invitee -> {
                                    String email = invitee.getEmail();
                                    Long memberId = invitee.getMemberId();
                                    if (email == null && memberId == null) return Mono.empty();

                                    EventInvitation invitation = EventInvitation.builder()
                                            .eventId(eventId)
                                            .memberId(memberId)
                                            .email(email != null ? email : "")
                                            .token(UUID.randomUUID().toString())
                                            .invitedBy(invitedBy)
                                            .expiresAt(LocalDateTime.now().plusDays(7))
                                            .build();

                                    return eventRepository.createInvitation(invitation)
                                            .flatMap(inv -> sendInvitationEmail(event, inv))
                                            .thenReturn(1);
                                })
                                .reduce(0, Integer::sum)));
    }

    private Mono<Void> sendInvitationEmail(Event event, EventInvitation invitation) {
        if (invitation.getEmail() == null || invitation.getEmail().isBlank()) return Mono.empty();
        Map<String, Object> vars = Map.of(
                "eventTitle", event.getTitle(),
                "eventLocation", event.getLocation() != null ? event.getLocation() : "",
                "eventStartTime", event.getStartTime() != null ? event.getStartTime().toString() : "",
                "confirmToken", invitation.getToken()
        );
        return emailService.sendHtmlEmail(
                invitation.getEmail(),
                "[Alumniverse] Lời mời tham gia: " + event.getTitle(),
                "eventInvitation",
                vars
        );
    }

    // ─── Step 2.1: Confirm invitation via website ─────────────────────────────

    public Mono<EventTicket> confirmInvitation(String token) {
        return eventRepository.findInvitationByToken(token)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.INVITATION_NOT_FOUND, "Invitation not found")))
                .flatMap(invitation -> {
                    if (invitation.getStatus() == Status.CONFIRMED || invitation.getStatus() == Status.DECLINED) {
                        return Mono.error(new ApplicationException(ErrorCode.INVITATION_ALREADY_USED, "Invitation already used"));
                    }
                    if (invitation.getExpiresAt() != null && invitation.getExpiresAt().isBefore(LocalDateTime.now())) {
                        return Mono.error(new ApplicationException(ErrorCode.INVITATION_EXPIRED, "Invitation has expired"));
                    }
                    return eventRepository.confirmInvitation(invitation.getId())
                            .flatMap(confirmed -> eventRepository.findEventById(confirmed.getEventId())
                                    .flatMap(event -> {
                                        EventTicket ticket = EventTicket.builder()
                                                .eventId(confirmed.getEventId())
                                                .memberId(confirmed.getMemberId())
                                                .guestEmail(confirmed.getEmail())
                                                .build();
                                        return checkCapacityAndRegister(event, ticket);
                                    }));
                });
    }

    // ─── Step 2.2: Self-register → PENDING ───────────────────────────────────

    public Mono<EventTicket> registerForEvent(Long eventId, RegisterTicketRequest request) {
        return SecurityUtils.getCurrentUserId().flatMap(memberId ->
                eventRepository.findEventById(eventId)
                        .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found: " + eventId)))
                        .flatMap(event -> eventRepository.hasRegistered(eventId, memberId)
                                .flatMap(already -> {
                                    if (already) return Mono.error(new ApplicationException(ErrorCode.TICKET_ALREADY_REGISTERED, "Already registered"));
                                    EventTicket ticket = EventTicket.builder()
                                            .eventId(eventId)
                                            .memberId(memberId)
                                            .guestName(request != null ? request.getGuestName() : null)
                                            .guestEmail(request != null ? request.getGuestEmail() : null)
                                            .guestPhone(request != null ? request.getGuestPhone() : null)
                                            .build();
                                    return checkCapacityAndRegister(event, ticket);
                                })));
    }

    private Mono<EventTicket> checkCapacityAndRegister(Event event, EventTicket ticket) {
        if (event.getMaxCapacity() != null && event.getMaxCapacity() > 0) {
            return eventRepository.countRegisteredTickets(event.getId())
                    .flatMap(count -> {
                        if (count >= event.getMaxCapacity()) {
                            return Mono.error(new ApplicationException(ErrorCode.EVENT_FULLY_BOOKED, "Event is fully booked"));
                        }
                        return eventRepository.registerTicket(ticket);
                    });
        }
        return eventRepository.registerTicket(ticket);
    }

    // ─── Step 3: Approve / reject tickets ────────────────────────────────────

    public Mono<EventTicket> approveTicket(Long ticketId) {
        return SecurityUtils.getCurrentUserId().flatMap(adminId ->
                eventRepository.findTicketById(ticketId)
                        .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.TICKET_NOT_FOUND, "Ticket not found: " + ticketId)))
                        .flatMap(ticket -> {
                            if (ticket.getStatus() != Status.PENDING) {
                                return Mono.error(new ApplicationException(ErrorCode.TICKET_NOT_PENDING, "Ticket is not pending"));
                            }
                            return eventRepository.approveTicket(ticketId, adminId);
                        }));
    }

    public Mono<EventTicket> rejectTicket(Long ticketId, ApproveTicketRequest request) {
        return SecurityUtils.getCurrentUserId().flatMap(adminId ->
                eventRepository.findTicketById(ticketId)
                        .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.TICKET_NOT_FOUND, "Ticket not found: " + ticketId)))
                        .flatMap(ticket -> {
                            if (ticket.getStatus() != Status.PENDING) {
                                return Mono.error(new ApplicationException(ErrorCode.TICKET_NOT_PENDING, "Ticket is not pending"));
                            }
                            return eventRepository.rejectTicket(ticketId, adminId, request != null ? request.getRejectReason() : null);
                        }));
    }

    public Mono<Integer> bulkApproveTickets(Long eventId, BulkApproveRequest request) {
        return SecurityUtils.getCurrentUserId().flatMap(adminId ->
                Flux.fromIterable(request.getTicketIds())
                        .flatMap(ticketId -> eventRepository.approveTicket(ticketId, adminId)
                                .thenReturn(1)
                                .onErrorReturn(0))
                        .reduce(0, Integer::sum));
    }

    public Mono<Integer> approveAllPending(Long eventId) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(adminId -> eventRepository.approveAllPendingTickets(eventId, adminId));
    }

    // ─── Step 4: Bulk reminder email ─────────────────────────────────────────

    public Mono<Integer> sendReminderEmails(Long eventId, ReminderEmailRequest request) {
        return SecurityUtils.getCurrentUserId().flatMap(adminId ->
                eventRepository.findEventById(eventId)
                        .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found: " + eventId)))
                        .flatMap(event -> {
                            Flux<EventTicket> ticketFlux = request.getTicketIds() != null && !request.getTicketIds().isEmpty()
                                    ? Flux.fromIterable(request.getTicketIds())
                                            .flatMap(id -> eventRepository.findTicketById(id))
                                    : eventRepository.findIssuedTicketsByEvent(eventId);

                            return ticketFlux
                                    .filter(t -> t.getGuestEmail() != null && !t.getGuestEmail().isBlank())
                                    .flatMap(ticket -> {
                                        Map<String, Object> vars = Map.of(
                                                "eventTitle", event.getTitle(),
                                                "eventLocation", event.getLocation() != null ? event.getLocation() : "",
                                                "eventStartTime", event.getStartTime() != null ? event.getStartTime().toString() : "",
                                                "customBody", request.getBody()
                                        );
                                        return emailService.sendHtmlEmail(ticket.getGuestEmail(), request.getSubject(), "eventReminder", vars)
                                                .thenReturn(1)
                                                .onErrorReturn(0);
                                    })
                                    .reduce(0, Integer::sum)
                                    .flatMap(count -> {
                                        EventEmailLog log = EventEmailLog.builder()
                                                .eventId(eventId)
                                                .sentBy(adminId)
                                                .subject(request.getSubject())
                                                .templateName("eventReminder")
                                                .recipientCount(count)
                                                .build();
                                        return eventRepository.saveEmailLog(log).thenReturn(count);
                                    });
                        }));
    }

    // ─── Step 5: Send ticket email (sau khi issue) ────────────────────────────

    public Mono<Integer> sendIssuedTicketEmails(Long eventId) {
        return SecurityUtils.getCurrentUserId().flatMap(adminId ->
                eventRepository.findEventById(eventId)
                        .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found: " + eventId)))
                        .flatMap(event -> eventRepository.findIssuedTicketsByEvent(eventId)
                                .filter(t -> t.getGuestEmail() != null && !t.getGuestEmail().isBlank())
                                .flatMap(ticket -> sendTicketEmail(event, ticket)
                                        .thenReturn(1)
                                        .onErrorReturn(0))
                                .reduce(0, Integer::sum)
                                .flatMap(count -> {
                                    EventEmailLog log = EventEmailLog.builder()
                                            .eventId(eventId)
                                            .sentBy(adminId)
                                            .subject("Vé tham dự: " + event.getTitle())
                                            .templateName("eventTicket")
                                            .recipientCount(count)
                                            .build();
                                    return eventRepository.saveEmailLog(log).thenReturn(count);
                                })));
    }

    private Mono<Void> sendTicketEmail(Event event, EventTicket ticket) {
        Map<String, Object> vars = Map.of(
                "eventTitle", event.getTitle(),
                "eventLocation", event.getLocation() != null ? event.getLocation() : "",
                "eventStartTime", event.getStartTime() != null ? event.getStartTime().toString() : "",
                "ticketCode", ticket.getTicketCode(),
                "guestName", ticket.getGuestName() != null ? ticket.getGuestName() : ""
        );
        return emailService.sendHtmlEmail(
                ticket.getGuestEmail(),
                "[Alumniverse] Vé tham dự: " + event.getTitle(),
                "eventTicket",
                vars
        );
    }

    // ─── Step 6: Activate tickets ─────────────────────────────────────────────

    public Mono<Integer> activateTickets(Long eventId) {
        return eventRepository.findEventById(eventId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found: " + eventId)))
                .flatMap(e -> eventRepository.activateTicketsForEvent(eventId));
    }

    public Mono<EventTicket> checkInTicket(String ticketCode) {
        return eventRepository.findTicketByCode(ticketCode)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.TICKET_NOT_FOUND, "Ticket not found")))
                .flatMap(ticket -> {
                    if (ticket.getStatus() == Status.CANCELLED || ticket.getStatus() == Status.EXPIRED) {
                        return Mono.error(new ApplicationException(ErrorCode.TICKET_ALREADY_CANCELLED, "Ticket is cancelled or expired"));
                    }
                    if (ticket.getStatus() == Status.CHECKED_IN || ticket.getStatus() == Status.USED) {
                        return Mono.error(new ApplicationException(ErrorCode.TICKET_ALREADY_CHECKED_IN, "Ticket already checked in"));
                    }
                    if (ticket.getStatus() != Status.ACTIVE) {
                        return Mono.error(new ApplicationException(ErrorCode.TICKET_NOT_ACTIVE, "Ticket is not active yet"));
                    }
                    return eventRepository.checkInTicket(ticket.getId());
                });
    }

    // ─── Step 7: Expire tickets after event ───────────────────────────────────

    public Mono<Integer> expireTickets(Long eventId) {
        return eventRepository.findEventById(eventId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found: " + eventId)))
                .flatMap(e -> eventRepository.expireTicketsForEvent(eventId));
    }

    // ─── Ticket queries ───────────────────────────────────────────────────────

    public Mono<EventTicket> cancelTicket(String ticketCode) {
        return eventRepository.findTicketByCode(ticketCode)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.TICKET_NOT_FOUND, "Ticket not found")))
                .flatMap(ticket -> {
                    if (ticket.getStatus() == Status.CANCELLED) {
                        return Mono.error(new ApplicationException(ErrorCode.TICKET_ALREADY_CANCELLED, "Ticket already cancelled"));
                    }
                    return eventRepository.cancelTicket(ticket.getId());
                });
    }

    public Mono<EventTicket> getTicketByCode(String ticketCode) {
        return eventRepository.findTicketByCode(ticketCode)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.TICKET_NOT_FOUND, "Ticket not found: " + ticketCode)));
    }

    public Mono<PaginatedResponse<EventTicket>> getTicketsByEvent(Long eventId, int page, int limit) {
        return eventRepository.findTicketsByEvent(eventId, page, limit);
    }

    public Mono<PaginatedResponse<EventTicket>> getTicketsByEventAndStatus(Long eventId, String status, int page, int limit) {
        return eventRepository.findTicketsByEventAndStatus(eventId, status, page, limit);
    }

    public Mono<PaginatedResponse<EventTicket>> getMyTickets(int page, int limit) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(memberId -> eventRepository.findTicketsByMember(memberId, page, limit));
    }

    // ─── Invitation queries ───────────────────────────────────────────────────

    public Mono<PaginatedResponse<EventInvitation>> getInvitationsByEvent(Long eventId, int page, int limit) {
        return eventRepository.findInvitationsByEvent(eventId, page, limit);
    }

    // ─── Email log queries ────────────────────────────────────────────────────

    public Mono<PaginatedResponse<EventEmailLog>> getEmailLogsByEvent(Long eventId, int page, int limit) {
        return eventRepository.findEmailLogsByEvent(eventId, page, limit);
    }

    // ─── Statistics ───────────────────────────────────────────────────────────

    public Mono<EventStatisticsResponse> getEventStatistics(Long eventId) {
        return eventRepository.findEventById(eventId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found: " + eventId)))
                .flatMap(e -> eventRepository.getEventStatistics(eventId));
    }
}
