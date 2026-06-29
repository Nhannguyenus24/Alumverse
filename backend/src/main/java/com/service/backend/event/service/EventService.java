package com.service.backend.event.service;

import com.service.backend.shared.entity.*;
import com.service.backend.event.dao.AttendeeLookupRepository;
import com.service.backend.event.dao.IEventRepository;
import com.service.backend.event.dto.*;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.enums.QuestionType;
import com.service.backend.shared.enums.Status;
import com.service.backend.organization.dao.OrganizationRepository;
import com.service.backend.shared.utils.CacheUtils;
import com.service.backend.user.service.NotificationService;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.service.EmailService;
import com.service.backend.shared.service.ImageService;
import com.service.backend.shared.utils.JsonUtils;
import com.service.backend.shared.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventService {

    private final IEventRepository eventRepository;
    private final ImageService imageService;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final OrganizationRepository organizationRepository;
    private final CacheUtils cacheUtils;
    private final EventQrService eventQrService;
    private final AttendeeLookupRepository attendeeLookupRepository;

    /**
     * Concurrency bound for bulk email loops. flatMap defaults to 256 in-flight subscriptions,
     * which can overwhelm the SMTP server and the shared boundedElastic pool when blasting many
     * recipients. Bounding it keeps the same set of emails/result while using fewer resources.
     */
    private static final int BULK_EMAIL_CONCURRENCY = 8;

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
        return Mono.zip(SecurityUtils.getCurrentUserId(), SecurityUtils.hasRole("ADMIN"))
                .flatMap(ctx -> {
                    Long currentUserId = ctx.getT1();
                    boolean isAdmin = ctx.getT2();
                    return eventRepository.findEventById(eventId)
                            .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found: " + eventId)))
                            .flatMap(existingEvent -> {
                                if (!isAdmin && !existingEvent.getCreatorMemberId().equals(currentUserId)) {
                                    return Mono.error(new ApplicationException(ErrorCode.FORBIDDEN));
                                }
                                return imageService.uploadBase64IfPresent(request.getBannerBase64())
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
                                        });
                            });
                });
    }

    public Mono<Boolean> deleteEvent(Long eventId) {
        return Mono.zip(SecurityUtils.getCurrentUserId(), SecurityUtils.hasRole("ADMIN"))
                .flatMap(ctx -> {
                    Long currentUserId = ctx.getT1();
                    boolean isAdmin = ctx.getT2();
                    return eventRepository.findEventById(eventId)
                            .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found: " + eventId)))
                            .flatMap(existingEvent -> {
                                if (!isAdmin && !existingEvent.getCreatorMemberId().equals(currentUserId)) {
                                    return Mono.error(new ApplicationException(ErrorCode.FORBIDDEN));
                                }
                                return eventRepository.deleteEvent(eventId);
                            });
                });
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
        String cacheKey = "upcoming_events_org_" + organizationId + "_page_" + page + "_limit_" + limit;
        return cacheUtils.getOrCompute("event_cache", cacheKey, java.time.Duration.ofMinutes(5), () ->
                eventRepository.findUpcomingEvents(organizationId, page, limit)
                        .doOnNext(res -> log.info("Fetched {} upcoming events for organization {}: {}", res.getItems().size(), organizationId, JsonUtils.toJson(res.getItems())))
        );
    }

    public Mono<PaginatedResponse<Event>> getUpcomingEvents(int page, int limit) {
        String cacheKey = "upcoming_events_global_page_" + page + "_limit_" + limit;
        return cacheUtils.getOrCompute("event_cache", cacheKey, java.time.Duration.ofMinutes(5), () ->
                eventRepository.findUpcomingEvents(page, limit)
                        .doOnNext(res -> log.info("Fetched {} upcoming events globally: {}", res.getItems().size(), JsonUtils.toJson(res.getItems())))
        );
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
                                            .flatMap(inv -> sendInvitationEmail(event, inv)
                                                    .then(notifyInvitation(event, inv)))
                                            .thenReturn(1);
                                }, BULK_EMAIL_CONCURRENCY)
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
                                        return checkCapacityAndRegister(event, ticket, null)
                                                .doOnNext(saved -> notifyRegistration(event, saved));
                                    }));
                });
    }

    // ─── Step 2.2: Self-register → ISSUED ────────────────────────────────────

    public Mono<EventTicket> registerForEvent(Long eventId, RegisterTicketRequest request) {
        return SecurityUtils.getCurrentUserId().flatMap(memberId ->
                eventRepository.findEventById(eventId)
                        .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found: " + eventId)))
                        .flatMap(event -> eventRepository.hasRegistered(eventId, memberId)
                                .flatMap(already -> {
                                    if (already) return Mono.error(new ApplicationException(ErrorCode.TICKET_ALREADY_REGISTERED, "Already registered"));
                                    return validateRegistrationAnswers(eventId, request != null ? request.getAnswers() : null)
                                            .flatMap(answersJson -> {
                                                EventTicket ticket = EventTicket.builder()
                                                        .eventId(eventId)
                                                        .memberId(memberId)
                                                        .guestName(request != null ? request.getGuestName() : null)
                                                        .guestEmail(request != null ? request.getGuestEmail() : null)
                                                        .guestPhone(request != null ? request.getGuestPhone() : null)
                                                        .build();
                                                ticket.setRegistrationAnswersFromObject(answersJson);
                                                return checkCapacityAndRegister(event, ticket, answersJson)
                                                        .doOnNext(saved -> notifyRegistration(event, saved));
                                            });
                                })));
    }

    private Mono<List<Map<String, Object>>> validateRegistrationAnswers(Long eventId, List<AnswerItem> answers) {
        return eventRepository.findQuestionsByEvent(eventId).collectList()
                .flatMap(questions -> {
                    if (questions.isEmpty()) {
                        return Mono.just(answers == null ? List.of() : toAnswerMaps(answers));
                    }
                    Map<Integer, AnswerItem> answerMap = new HashMap<>();
                    if (answers != null) {
                        for (AnswerItem item : answers) {
                            if (item != null && item.getQuestionId() != null) {
                                answerMap.put(item.getQuestionId(), item);
                            }
                        }
                    }
                    List<Map<String, Object>> normalized = new ArrayList<>();
                    for (EventQuestion question : questions) {
                        AnswerItem answer = answerMap.get(question.getId());
                        Object value = answer != null ? answer.getValue() : null;
                        boolean hasAnswer = hasAnswerValue(value);
                        if (Boolean.TRUE.equals(question.getRequired()) && !hasAnswer) {
                            return Mono.error(new ApplicationException(ErrorCode.EVENT_REGISTRATION_ANSWER_INVALID,
                                    "Missing required answer for: " + question.getLabel()));
                        }
                        if (!hasAnswer) continue;
                        if (question.getType() == QuestionType.SINGLE_CHOICE) {
                            String selected = value instanceof String ? (String) value : String.valueOf(value);
                            if (question.getOptions() == null || !question.getOptions().contains(selected)) {
                                return Mono.error(new ApplicationException(ErrorCode.EVENT_REGISTRATION_ANSWER_INVALID,
                                        "Invalid option for: " + question.getLabel()));
                            }
                            normalized.add(Map.of("questionId", question.getId(), "value", selected));
                        } else if (question.getType() == QuestionType.MULTI_CHOICE) {
                            List<String> selected = toStringList(value);
                            if (selected.isEmpty() || question.getOptions() == null
                                    || !new HashSet<>(question.getOptions()).containsAll(selected)) {
                                return Mono.error(new ApplicationException(ErrorCode.EVENT_REGISTRATION_ANSWER_INVALID,
                                        "Invalid options for: " + question.getLabel()));
                            }
                            normalized.add(Map.of("questionId", question.getId(), "value", selected));
                        } else {
                            String text = value instanceof String ? ((String) value).trim() : String.valueOf(value).trim();
                            if (text.isEmpty()) {
                                return Mono.error(new ApplicationException(ErrorCode.EVENT_REGISTRATION_ANSWER_INVALID,
                                        "Answer required for: " + question.getLabel()));
                            }
                            normalized.add(Map.of("questionId", question.getId(), "value", text));
                        }
                    }
                    return Mono.just(normalized);
                });
    }

    private List<Map<String, Object>> toAnswerMaps(List<AnswerItem> answers) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (AnswerItem item : answers) {
            if (item == null || item.getQuestionId() == null) continue;
            result.add(Map.of("questionId", item.getQuestionId(), "value", item.getValue()));
        }
        return result;
    }

    private boolean hasAnswerValue(Object value) {
        if (value == null) return false;
        if (value instanceof String s) return !s.trim().isEmpty();
        if (value instanceof List<?> list) return !list.isEmpty();
        return true;
    }

    private List<String> toStringList(Object value) {
        if (value instanceof List<?> list) {
            List<String> result = new ArrayList<>();
            for (Object item : list) {
                if (item != null) result.add(String.valueOf(item));
            }
            return result;
        }
        return List.of(String.valueOf(value));
    }

    private Mono<EventTicket> checkCapacityAndRegister(Event event, EventTicket ticket, List<Map<String, Object>> answersJson) {
        if (answersJson != null) {
            ticket.setRegistrationAnswersFromObject(answersJson);
        }
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

    // ─── Step 3: Bulk reminder email ─────────────────────────────────────────

    public Mono<Integer> sendReminderEmails(Long eventId, ReminderEmailRequest request) {
        return SecurityUtils.getCurrentUserId().flatMap(adminId ->
                eventRepository.findEventById(eventId)
                        .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found: " + eventId)))
                        .flatMap(event -> {
                            Flux<EventTicket> ticketFlux = request.getTicketIds() != null && !request.getTicketIds().isEmpty()
                                    ? eventRepository.findTicketsByIds(request.getTicketIds())
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
                                    }, BULK_EMAIL_CONCURRENCY)
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
                                        .onErrorReturn(0), BULK_EMAIL_CONCURRENCY)
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

    // ─── Step 6: Check-in (event-scoped, QR-encrypted, staff-only) ────────────

    /**
     * Check in a ticket for {@code eventId}. The caller supplies either the encrypted {@code qrToken}
     * scanned from the QR (preferred) or the raw ticket {@code code} (manual fallback). Both paths
     * enforce, server-side, that the ticket belongs to {@code eventId} ({@link ErrorCode#TICKET_WRONG_EVENT}),
     * and that the caller is staff. Returns the holder's profile so staff can verify the person.
     */
    public Mono<EventTicketDetailResponse> checkIn(Long eventId, CheckInRequest request) {
        return requireStaff()
                .then(resolveTicketCode(eventId, request))
                .flatMap(ticketCode -> eventRepository.findTicketByCode(ticketCode)
                        .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.TICKET_NOT_FOUND, "Ticket not found")))
                        .flatMap(ticket -> {
                            if (!eventId.equals(ticket.getEventId())) {
                                return Mono.error(new ApplicationException(ErrorCode.TICKET_WRONG_EVENT, "Ticket does not belong to this event"));
                            }
                            if (ticket.getStatus() == Status.CANCELLED || ticket.getStatus() == Status.EXPIRED) {
                                return Mono.error(new ApplicationException(ErrorCode.TICKET_ALREADY_CANCELLED, "Ticket is cancelled or expired"));
                            }
                            if (ticket.getStatus() == Status.CHECKED_IN || ticket.getStatus() == Status.USED) {
                                return Mono.error(new ApplicationException(ErrorCode.TICKET_ALREADY_CHECKED_IN, "Ticket already checked in"));
                            }
                            if (ticket.getStatus() != Status.ISSUED && ticket.getStatus() != Status.ACTIVE) {
                                return Mono.error(new ApplicationException(ErrorCode.TICKET_NOT_ACTIVE, "Ticket is not valid for check-in"));
                            }
                            return eventRepository.checkInTicket(ticket.getId());
                        }))
                .flatMap(this::toDetailWithAttendee);
    }

    /** Resolve the ticket code to check in: decode + event-match the QR token, else use the manual code. */
    private Mono<String> resolveTicketCode(Long eventId, CheckInRequest request) {
        String qrToken = request != null ? request.getQrToken() : null;
        String code = request != null ? request.getCode() : null;
        if (qrToken != null && !qrToken.isBlank()) {
            return Mono.fromCallable(() -> eventQrService.decode(qrToken))
                    .flatMap(ref -> {
                        if (ref.eventId() != null && !ref.eventId().equals(eventId)) {
                            return Mono.error(new ApplicationException(ErrorCode.TICKET_WRONG_EVENT, "QR code belongs to another event"));
                        }
                        return Mono.just(ref.ticketCode());
                    });
        }
        if (code != null && !code.isBlank()) {
            return Mono.just(code.trim().toUpperCase());
        }
        return Mono.error(new ApplicationException(ErrorCode.TICKET_QR_INVALID, "Missing QR token or ticket code"));
    }

    private Mono<Void> requireStaff() {
        return SecurityUtils.getCurrentUserRole()
                .filter(role -> role.equalsIgnoreCase("ADMIN")
                        || role.equalsIgnoreCase("STAFF")
                        || role.equalsIgnoreCase("MODERATOR"))
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.FORBIDDEN, "Only staff can check in tickets")))
                .then();
    }

    // ─── Ticket queries ───────────────────────────────────────────────────────

    public Mono<EventTicket> cancelTicket(String ticketCode, String reason) {
        if (reason == null || reason.isBlank()) {
            return Mono.error(new ApplicationException(ErrorCode.CANCEL_REASON_REQUIRED, "Cancel reason is required"));
        }
        return eventRepository.findTicketByCode(ticketCode)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.TICKET_NOT_FOUND, "Ticket not found")))
                .flatMap(ticket -> {
                    if (ticket.getStatus() == Status.CANCELLED) {
                        return Mono.error(new ApplicationException(ErrorCode.TICKET_ALREADY_CANCELLED, "Ticket already cancelled"));
                    }
                    return eventRepository.cancelTicket(ticket.getId(), reason.trim());
                });
    }

    public Mono<EventTicketDetailResponse> getTicketByCode(String ticketCode) {
        return eventRepository.findTicketByCode(ticketCode)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.TICKET_NOT_FOUND, "Ticket not found: " + ticketCode)))
                .flatMap(this::toDetailWithAttendee);
    }

    public Mono<PaginatedResponse<EventTicket>> getTicketsByEvent(Long eventId, String status, String keyword, int page, int limit) {
        if (keyword != null && !keyword.isBlank()) {
            return status != null
                    ? eventRepository.searchTicketsByEventAndStatus(eventId, status, keyword.trim(), page, limit)
                    : eventRepository.searchTicketsByEvent(eventId, keyword.trim(), page, limit);
        }
        return status != null
                ? eventRepository.findTicketsByEventAndStatus(eventId, status, page, limit)
                : eventRepository.findTicketsByEvent(eventId, page, limit);
    }

    public Mono<PaginatedResponse<EventTicketDetailResponse>> getMyTickets(int page, int limit) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(memberId -> eventRepository.findTicketsByMember(memberId, page, limit))
                .map(this::mapDetailPage);
    }

    // ─── Ticket response mapping (qrToken + attendee enrichment) ──────────────

    /** Map a ticket to a response carrying the encrypted QR token (no attendee lookup). */
    private EventTicketDetailResponse toDetail(EventTicket ticket) {
        return EventTicketDetailResponse.fromTicket(ticket)
                .qrToken(eventQrService.encodeWithPrefix(ticket.getTicketCode(), ticket.getEventId()))
                .build();
    }

    /** Map a ticket to a response, additionally resolving the holder's profile for verification. */
    private Mono<EventTicketDetailResponse> toDetailWithAttendee(EventTicket ticket) {
        EventTicketDetailResponse.EventTicketDetailResponseBuilder builder = EventTicketDetailResponse.fromTicket(ticket)
                .qrToken(eventQrService.encodeWithPrefix(ticket.getTicketCode(), ticket.getEventId()));
        if (ticket.getMemberId() == null) {
            return Mono.just(builder.build());
        }
        return attendeeLookupRepository.findByUserId(ticket.getMemberId().intValue())
                .map(profile -> builder
                        .attendeeName(profile.fullName())
                        .attendeeEmail(profile.email())
                        .attendeeAvatarUrl(profile.avatarUrl())
                        .build())
                .defaultIfEmpty(builder.build());
    }

    private PaginatedResponse<EventTicketDetailResponse> mapDetailPage(PaginatedResponse<EventTicket> page) {
        return PaginatedResponse.<EventTicketDetailResponse>builder()
                .items(page.getItems().stream().map(this::toDetail).toList())
                .currentPage(page.getCurrentPage())
                .pageSize(page.getPageSize())
                .totalPage(page.getTotalPage())
                .totalItem(page.getTotalItem())
                .hasNext(page.getHasNext())
                .hasPrevious(page.getHasPrevious())
                .build();
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

    // ─── Event questions ──────────────────────────────────────────────────────

    public Flux<EventQuestionResponse> getEventQuestions(Long eventId) {
        return eventRepository.findEventById(eventId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found: " + eventId)))
                .thenMany(eventRepository.findQuestionsByEvent(eventId).map(EventQuestionResponse::from));
    }

    public Mono<EventQuestionResponse> createEventQuestion(Long eventId, EventQuestionRequest request) {
        return assertEventInCurrentOrg(eventId)
                .flatMap(event -> {
                    validateQuestionRequest(request);
                    EventQuestion question = EventQuestion.builder()
                            .eventId(eventId)
                            .type(request.getType())
                            .label(request.getLabel().trim())
                            .required(request.getRequired() != null ? request.getRequired() : false)
                            .orderIndex(request.getOrderIndex() != null ? request.getOrderIndex() : 0)
                            .build();
                    question.setOptions(request.getOptions());
                    return eventRepository.createQuestion(question).map(EventQuestionResponse::from);
                });
    }

    public Mono<EventQuestionResponse> updateEventQuestion(Long eventId, Integer questionId, EventQuestionRequest request) {
        return assertEventInCurrentOrg(eventId)
                .flatMap(event -> eventRepository.findQuestionById(questionId)
                        .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.RESOURCES_NOT_FOUND, "Question not found")))
                        .flatMap(existing -> {
                            if (!eventId.equals(existing.getEventId())) {
                                return Mono.error(new ApplicationException(ErrorCode.FORBIDDEN, "Question does not belong to event"));
                            }
                            validateQuestionRequest(request);
                            EventQuestion updated = EventQuestion.builder()
                                    .type(request.getType())
                                    .label(request.getLabel().trim())
                                    .required(request.getRequired())
                                    .orderIndex(request.getOrderIndex())
                                    .build();
                            updated.setOptions(request.getOptions());
                            return eventRepository.updateQuestion(questionId, updated).map(EventQuestionResponse::from);
                        }));
    }

    public Mono<Boolean> deleteEventQuestion(Long eventId, Integer questionId) {
        return assertEventInCurrentOrg(eventId)
                .flatMap(event -> eventRepository.deleteQuestion(eventId, questionId));
    }

    public Mono<Boolean> reorderEventQuestions(Long eventId, ReorderEventQuestionsRequest request) {
        return assertEventInCurrentOrg(eventId)
                .flatMap(event -> eventRepository.reorderQuestions(eventId, request.getQuestionIds()));
    }

    private Mono<Event> assertEventInCurrentOrg(Long eventId) {
        return Mono.zip(SecurityUtils.getCurrentOrganizationId(), eventRepository.findEventById(eventId)
                        .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found: " + eventId))))
                .flatMap(tuple -> {
                    Integer orgId = tuple.getT1();
                    Event event = tuple.getT2();
                    if (event.getOrganizationId() == null || !event.getOrganizationId().equals(orgId.longValue())) {
                        return Mono.error(new ApplicationException(ErrorCode.FORBIDDEN, "Event not in current organization"));
                    }
                    return Mono.just(event);
                });
    }

    private void validateQuestionRequest(EventQuestionRequest request) {
        if (request.getType() == null) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST, "Question type is required");
        }
        if (request.getLabel() == null || request.getLabel().isBlank()) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST, "Question label is required");
        }
        if ((request.getType() == QuestionType.SINGLE_CHOICE || request.getType() == QuestionType.MULTI_CHOICE)
                && (request.getOptions() == null || request.getOptions().isEmpty())) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST, "Options are required for choice questions");
        }
    }

    // ─── Notifications ────────────────────────────────────────────────────────

    private void notifyRegistration(Event event, EventTicket ticket) {
        if (ticket.getMemberId() == null) return;
        buildTicketLink(event, ticket.getTicketCode())
                .subscribe(link -> notificationService.createNotificationAsync(
                        ticket.getMemberId().intValue(),
                        "Đăng ký sự kiện thành công",
                        event.getTitle(),
                        link));
    }

    private Mono<Void> notifyInvitation(Event event, EventInvitation invitation) {
        if (invitation.getMemberId() == null) return Mono.empty();
        return buildTicketLink(event, null)
                .doOnNext(link -> notificationService.createNotificationAsync(
                        invitation.getMemberId().intValue(),
                        "Lời mời tham gia sự kiện",
                        event.getTitle(),
                        link))
                .then();
    }

    private Mono<String> buildTicketLink(Event event, String ticketCode) {
        if (event.getOrganizationId() == null) {
            String path = ticketCode != null ? "/my-tickets?ticket=" + ticketCode : "/my-tickets";
            return Mono.just(path);
        }
        return organizationRepository.findById(event.getOrganizationId().intValue())
                .map(org -> {
                    String slug = org.getSlug() != null ? org.getSlug() : String.valueOf(event.getOrganizationId());
                    return ticketCode != null
                            ? "/" + slug + "/my-tickets?ticket=" + ticketCode
                            : "/" + slug + "/my-tickets";
                })
                .defaultIfEmpty(ticketCode != null ? "/my-tickets?ticket=" + ticketCode : "/my-tickets");
    }
}
