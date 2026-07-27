package com.service.backend.event.service;

import com.service.backend.article.validation.ArticleTopicCatalog;
import com.service.backend.shared.entity.*;
import com.service.backend.user.dao.UserProfileRepository;
import com.service.backend.event.dao.EventR2dbcRepository;
import com.service.backend.event.dao.EventInterestR2dbcRepository;
import com.service.backend.event.dao.EventTicketR2dbcRepository;
import com.service.backend.event.dao.EventInvitationR2dbcRepository;
import com.service.backend.event.dao.EventEmailLogR2dbcRepository;
import com.service.backend.event.dao.EventQuestionR2dbcRepository;
import com.service.backend.event.dto.*;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.enums.QuestionType;
import com.service.backend.shared.enums.Status;
import com.service.backend.organization.dao.OrganizationRepository;
import com.service.backend.shared.utils.CacheNames;
import com.service.backend.shared.utils.CacheUtils;
import com.service.backend.user.service.NotificationService;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.service.EmailService;
import com.service.backend.shared.service.ImageService;
import com.service.backend.shared.utils.JsonUtils;
import com.service.backend.shared.utils.SecurityUtils;
import com.service.backend.shared.utils.PaginationHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventService {

    private final EventR2dbcRepository eventRepo;
    private final EventInterestR2dbcRepository interestRepo;
    private final EventTicketR2dbcRepository ticketRepo;
    private final EventInvitationR2dbcRepository invitationRepo;
    private final EventEmailLogR2dbcRepository emailLogRepo;
    private final EventQuestionR2dbcRepository questionRepo;
    private final ImageService imageService;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final OrganizationRepository organizationRepository;
    private final CacheUtils cacheUtils;
    private final EventQrService eventQrService;
    private final UserProfileRepository userProfileRepository;

    /**
     * Concurrency bound for bulk email loops. flatMap defaults to 256 in-flight subscriptions,
     * which can overwhelm the SMTP server and the shared boundedElastic pool when blasting many
     * recipients. Bounding it keeps the same set of emails/result while using fewer resources.
     */
    private static final int BULK_EMAIL_CONCURRENCY = 8;

    // ─── Event CRUD ───────────────────────────────────────────────────────────

    public Mono<Event> createEvent(CreateEventRequest request) {
        String topic = ArticleTopicCatalog.requireValid(ArticleTopicCatalog.Channel.EVENT, request.getTopic());
        Mono<Integer> organizationIdMono = SecurityUtils.resolveOrganizationId(request.getOrganizationId())
                .switchIfEmpty(Mono.error(new ApplicationException(
                        ErrorCode.BAD_REQUEST,
                        "Organization ID is required to create an event"
                )));

        return Mono.zip(SecurityUtils.getCurrentUserId(), organizationIdMono)
                .flatMap(ctx -> {
                    Long userId = ctx.getT1();
                    Long orgId = ctx.getT2().longValue();
                    return SecurityUtils.assertCanManageContentOrganization(orgId)
                            .then(imageService.uploadBase64IfPresent(request.getBannerBase64())
                            .defaultIfEmpty("")
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
                                        .topic(topic)
                                        .requiresCheckIn(Boolean.TRUE.equals(request.getRequiresCheckIn()))
                                        .creatorMemberId(userId)
                                        .organizationId(orgId)
                                        .build();
                                return this.createEvent(event);
                            }));
                });
    }

    public Mono<Event> updateEvent(Long eventId, UpdateEventRequest request) {
        String topic = request.getTopic() != null
                ? ArticleTopicCatalog.requireValid(ArticleTopicCatalog.Channel.EVENT, request.getTopic())
                : null;
        return this.findEventById(eventId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found: " + eventId)))
                .flatMap(existingEvent -> SecurityUtils.assertCanManageContentOrganization(existingEvent.getOrganizationId())
                        .then(imageService.uploadBase64IfPresent(request.getBannerBase64())
                                .defaultIfEmpty("")
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
                                            .topic(request.getTopic() != null ? topic : existingEvent.getTopic())
                                            .requiresCheckIn(request.getRequiresCheckIn() != null ? request.getRequiresCheckIn() : existingEvent.getRequiresCheckIn())
                                            .build();
                                    return this.updateEvent(eventId, updatedEvent);
                                })));
    }

    public Mono<Boolean> deleteEvent(Long eventId) {
        return this.findEventById(eventId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found: " + eventId)))
                .flatMap(existingEvent -> SecurityUtils.assertCanManageContentOrganization(existingEvent.getOrganizationId())
                        .then(this.daoDeleteEvent(eventId)));
    }

    public Mono<Event> getEventById(Long eventId) {
        return this.findEventById(eventId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found: " + eventId)));
    }

    public Mono<Event> getVisibleEventById(Long eventId, Integer organizationId) {
        return this.findEventById(eventId)
                .flatMap(event -> SecurityUtils.canManageContentOrganization(event.getOrganizationId())
                        .flatMap(canManage -> {
                            if (Boolean.TRUE.equals(canManage)) {
                                return Mono.just(event);
                            }
                            return SecurityUtils.resolvePublicOrganizationId(organizationId)
                                    .filter(orgId -> Boolean.TRUE.equals(event.getIsPublished())
                                            && event.getOrganizationId() != null
                                            && event.getOrganizationId().equals(orgId.longValue()))
                                    .map(ignored -> event);
                        }))
                .switchIfEmpty(Mono.error(new ApplicationException(
                        ErrorCode.EVENT_NOT_FOUND, "Published event not found")));
    }


    public Mono<Event> publishEvent(Long eventId) {
        return this.findEventById(eventId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found: " + eventId)))
                .flatMap(e -> SecurityUtils.assertCanManageContentOrganization(e.getOrganizationId())
                        .then(this.daoPublishEvent(eventId)));
    }

    public Mono<Event> unpublishEvent(Long eventId) {
        return this.findEventById(eventId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found: " + eventId)))
                .flatMap(e -> SecurityUtils.assertCanManageContentOrganization(e.getOrganizationId())
                        .then(this.daoUnpublishEvent(eventId)));
    }

    public Mono<PaginatedResponse<Event>> getUpcomingEvents(Long organizationId, int page, int limit) {
        String cacheKey = "upcoming_events_org_" + organizationId + "_page_" + page + "_limit_" + limit;
        return cacheUtils.getOrCompute(CacheNames.EVENT, cacheKey, java.time.Duration.ofMinutes(5), () ->
                this.findUpcomingEvents(organizationId, page, limit)
                        .doOnNext(res -> log.debug("Fetched {} upcoming events for organization {}: {}", res.getItems().size(), organizationId, JsonUtils.toJson(res.getItems())))
        );
    }

    public Mono<PaginatedResponse<Event>> getOngoingEvents(Long organizationId, int page, int limit) {
        String cacheKey = "ongoing_events_org_" + organizationId + "_page_" + page + "_limit_" + limit;
        return cacheUtils.getOrCompute(CacheNames.EVENT, cacheKey, java.time.Duration.ofMinutes(5), () ->
                this.findOngoingEvents(organizationId, page, limit));
    }

    public Mono<PaginatedResponse<Event>> getPastEvents(Long organizationId, int page, int limit) {
        String cacheKey = "past_events_org_" + organizationId + "_page_" + page + "_limit_" + limit;
        return cacheUtils.getOrCompute(CacheNames.EVENT, cacheKey, java.time.Duration.ofMinutes(5), () ->
                this.findPastEvents(organizationId, page, limit));
    }

    public Mono<PaginatedResponse<Event>> searchEvents(Long organizationId, String keyword, int page, int limit) {
        String cacheKey = "search_events_org_" + organizationId + "_kw_" + keyword + "_page_" + page + "_limit_" + limit;
        return cacheUtils.getOrCompute(CacheNames.EVENT, cacheKey, java.time.Duration.ofMinutes(5), () ->
                this.daoSearchEvents(organizationId, keyword, page, limit));
    }

    /**
     * Clears the whole {@link CacheNames#EVENT} namespace. Called by every write that can change
     * what upcoming/past/search event lists return. Paginated/filtered keys mean we cannot target a
     * single key, so we clear the namespace (safe over-eviction, same pattern as ForumService).
     */
    private Mono<Void> evictEventCaches() {
        return cacheUtils.clear(CacheNames.EVENT);
    }

    // ─── Interest ─────────────────────────────────────────────────────────────

    public Mono<EventInterest> addInterest(Long eventId) {
        return SecurityUtils.getCurrentUserId().flatMap(memberId ->
                Mono.zip(
                        this.getVisibleEventById(eventId, null),
                        this.checkUserInterest(eventId, memberId)
                ).flatMap(tuple -> {
                    Boolean already = tuple.getT2();
                    if (already) return Mono.error(new ApplicationException(ErrorCode.ALREADY_INTERESTED, "Already interested"));
                    return this.addEventInterest(eventId, memberId);
                }));
    }

    public Mono<Boolean> removeInterest(Long eventId) {
        return SecurityUtils.getCurrentUserId().flatMap(memberId ->
                this.findEventById(eventId)
                        .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found: " + eventId)))
                        .flatMap(e -> this.removeEventInterest(eventId, memberId)));
    }

    public Mono<Boolean> checkInterest(Long eventId) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(memberId -> this.checkUserInterest(eventId, memberId));
    }

    public Mono<Boolean> checkRegistered(Long eventId) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(memberId -> this.checkUserRegistered(eventId, memberId));
    }

    public Mono<PaginatedResponse<EventInterestDetailResponse>> getEventInterests(Long eventId, int page, int limit) {
        return assertEventInCurrentOrg(eventId)
                .then(this.findEventInterests(eventId, page, limit))
                .flatMap(this::mapInterestPageWithMembers);
    }

    // ─── Step 1: Invite users ─────────────────────────────────────────────────

    public Mono<Integer> inviteUsers(Long eventId, InviteUsersRequest request) {
        return SecurityUtils.getCurrentUserId().flatMap(invitedBy ->
                assertEventInCurrentOrg(eventId)
                        .flatMap(event -> Flux.fromIterable(request.getInvitees())
                                .flatMap(invitee -> {
                                    String normalizedEmail = invitee.getEmail() != null
                                            ? invitee.getEmail().trim().toLowerCase(Locale.ROOT)
                                            : null;
                                    String email = normalizedEmail != null && !normalizedEmail.isBlank() ? normalizedEmail : null;
                                    Long memberId = invitee.getMemberId();
                                    if (email == null && memberId == null) return Mono.empty();

                                    Mono<Optional<Long>> resolvedMemberId = memberId != null
                                            ? Mono.just(Optional.of(memberId))
                                            : userProfileRepository.findAttendeeProfileByEmail(email)
                                                    .map(profile -> Optional.of(profile.id().longValue()))
                                                    .defaultIfEmpty(Optional.empty());

                                    return resolvedMemberId.flatMap(resolved -> {
                                        EventInvitation invitation = EventInvitation.builder()
                                                .eventId(eventId)
                                                .memberId(resolved.orElse(null))
                                                .email(email != null ? email : "")
                                                .token(UUID.randomUUID().toString())
                                                .invitedBy(invitedBy)
                                                .expiresAt(LocalDateTime.now().plusDays(7))
                                                .build();

                                        return this.createInvitation(invitation);
                                    });
                                }, BULK_EMAIL_CONCURRENCY)
                                .collectList()
                                // Response chỉ cần số lời mời đã tạo. Việc gửi email + notification
                                // (SMTP round-trip cho từng người) chạy nền, không chặn admin.
                                .doOnNext(created -> sendInvitationsAsync(event, created))
                                .map(List::size)));
    }

    /**
     * Gửi email mời + tạo notification bất đồng bộ cho danh sách lời mời, giới hạn số lượng
     * gửi đồng thời bằng {@link #BULK_EMAIL_CONCURRENCY} để không làm quá tải SMTP. Lỗi được log
     * và nuốt vì đây là công việc best-effort, không ảnh hưởng kết quả tạo lời mời.
     */
    private void sendInvitationsAsync(Event event, List<EventInvitation> invitations) {
        Flux.fromIterable(invitations)
                .flatMap(inv -> sendInvitationEmail(event, inv)
                        .then(notifyInvitation(event, inv))
                        .onErrorResume(e -> {
                            log.warn("Failed to send invitation for event {} invitation {}: {}",
                                    event.getId(), inv.getId(), e.getMessage());
                            return Mono.empty();
                        }), BULK_EMAIL_CONCURRENCY)
                .subscribe();
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
        return this.findInvitationByToken(token)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.INVITATION_NOT_FOUND, "Invitation not found")))
                .flatMap(invitation -> {
                    if (invitation.getStatus() == Status.CONFIRMED || invitation.getStatus() == Status.DECLINED) {
                        return Mono.error(new ApplicationException(ErrorCode.INVITATION_ALREADY_USED, "Invitation already used"));
                    }
                    if (invitation.getExpiresAt() != null && invitation.getExpiresAt().isBefore(LocalDateTime.now())) {
                        return Mono.error(new ApplicationException(ErrorCode.INVITATION_EXPIRED, "Invitation has expired"));
                    }
                    return this.confirmInvitation(invitation.getId())
                            .flatMap(confirmed -> this.findEventById(confirmed.getEventId())
                                    .flatMap(event -> {
                                        EventTicket ticket = EventTicket.builder()
                                                .eventId(confirmed.getEventId())
                                                .memberId(confirmed.getMemberId())
                                                .guestEmail(confirmed.getEmail())
                                                .build();
                                        return checkCapacityAndRegister(event, ticket, null)
                                                .doOnNext(saved -> {
                                                    sendTicketEmailAsync(event, saved);
                                                    notifyRegistration(event, saved);
                                                });
                                    }));
                });
    }

    // ─── Step 2.2: Self-register → ISSUED ────────────────────────────────────

    public Mono<EventTicket> registerForEvent(Long eventId, RegisterTicketRequest request) {
        return SecurityUtils.getCurrentUserId().flatMap(memberId ->
                Mono.zip(
                        this.findEventById(eventId)
                                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found: " + eventId))),
                        this.hasRegistered(eventId, memberId),
                        ticketRepo.existsBannedByEventIdAndMemberId(eventId, memberId)
                ).flatMap(tuple -> {
                    Event event = tuple.getT1();
                    Boolean already = tuple.getT2();
                    Boolean banned = tuple.getT3();
                    if (banned) return Mono.error(new ApplicationException(ErrorCode.EVENT_REGISTRATION_BANNED, "Banned from event: " + eventId));
                    if (already) return Mono.error(new ApplicationException(ErrorCode.TICKET_ALREADY_REGISTERED, "Already registered"));
                    return assertEventOpenForRegistration(event)
                            .then(Mono.defer(() -> validateRegistrationAnswers(
                                    eventId, request != null ? request.getAnswers() : null)))
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
                                                        .doOnNext(saved -> {
                                                            // Gửi email & tạo notification bất đồng bộ (fire-and-forget).
                                                            // Email không bắt buộc cho việc đăng ký thành công, không cần
                                                            // chờ SMTP round-trip (vài giây) trước khi trả response.
                                                            sendTicketEmailAsync(event, saved);
                                                            notifyRegistration(event, saved);
                                                        });
                                            });
                                }));
    }

    private Mono<List<Map<String, Object>>> validateRegistrationAnswers(Long eventId, List<AnswerItem> answers) {
        return this.findQuestionsByEvent(eventId).collectList()
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
            return this.countRegisteredTickets(event.getId())
                    .flatMap(count -> {
                        if (count >= event.getMaxCapacity()) {
                            return Mono.error(new ApplicationException(ErrorCode.EVENT_FULLY_BOOKED, "Event is fully booked"));
                        }
                        return this.registerTicket(ticket);
                    });
        }
        return this.registerTicket(ticket);
    }

    // ─── Step 3: Bulk reminder email ─────────────────────────────────────────

    public Mono<Integer> sendReminderEmails(Long eventId, ReminderEmailRequest request) {
        return SecurityUtils.getCurrentUserId().flatMap(adminId ->
                assertEventInCurrentOrg(eventId)
                        .flatMap(event -> {
                            Flux<EventTicket> ticketFlux = request.getTicketIds() != null && !request.getTicketIds().isEmpty()
                                    ? this.findTicketsByIds(request.getTicketIds())
                                    : this.findIssuedTicketsByEvent(eventId);

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
                                        return this.saveEmailLog(log).thenReturn(count);
                                    });
                        }));
    }

    // ─── Step 5: Send ticket email (sau khi issue) ────────────────────────────

    public Mono<Integer> sendIssuedTicketEmails(Long eventId) {
        return SecurityUtils.getCurrentUserId().flatMap(adminId ->
                assertEventInCurrentOrg(eventId)
                        .flatMap(event -> this.findIssuedTicketsByEvent(eventId)
                    .flatMap(ticket -> sendTicketEmail(event, ticket)
                        .map(sent -> sent ? 1 : 0)
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
                                    return this.saveEmailLog(log).thenReturn(count);
                                })));
    }

    /**
     * Gửi email vé bất đồng bộ, không chặn luồng gọi. Lỗi được log và nuốt vì email
     * không phải điều kiện thành công của việc đăng ký.
     */
    private void sendTicketEmailAsync(Event event, EventTicket ticket) {
        sendTicketEmail(event, ticket)
                .subscribe(
                        sent -> {},
                        e -> log.warn("Failed to send ticket email for event {} ticket {}: {}",
                                event.getId(), ticket.getTicketCode(), e.getMessage()));
    }

    private Mono<Boolean> sendTicketEmail(Event event, EventTicket ticket) {
        return resolveTicketRecipientEmail(ticket)
            .flatMap(recipientEmail -> buildTicketLink(event, ticket.getTicketCode())
                .flatMap(ticketLink -> {
                    String qrToken = eventQrService.encodeWithPrefix(ticket.getTicketCode(), ticket.getEventId());
                    Map<String, Object> vars = Map.of(
                            "eventTitle", event.getTitle(),
                            "eventLocation", event.getLocation() != null ? event.getLocation() : "",
                            "eventStartTime", event.getStartTime() != null ? event.getStartTime().toString() : "",
                            "ticketCode", ticket.getTicketCode(),
                            "guestName", ticket.getGuestName() != null ? ticket.getGuestName() : "",
                            "ticketQrContentId", "ticketQr",
                            "ticketLink", ticketLink
                    );
                    return emailService.sendHtmlEmailWithInlineImage(
                            recipientEmail,
                            "[Alumniverse] Vé tham dự: " + event.getTitle(),
                            "eventTicket",
                            vars,
                            "ticketQr",
                            eventQrService.toQrCodePngBytes(qrToken),
                            "image/png"
                    ).thenReturn(true);
                }))
                .switchIfEmpty(Mono.just(false));
    }

        private Mono<Void> sendTicketCancellationEmail(Event event, EventTicket ticket, String reason) {
        return resolveTicketRecipientEmail(ticket)
            .flatMap(recipientEmail -> buildTicketLink(event, ticket.getTicketCode())
                .flatMap(ticketLink -> {
                    Map<String, Object> vars = Map.of(
                        "eventTitle", event.getTitle(),
                        "eventLocation", event.getLocation() != null ? event.getLocation() : "",
                        "eventStartTime", event.getStartTime() != null ? event.getStartTime().toString() : "",
                        "ticketCode", ticket.getTicketCode(),
                        "cancelReason", reason != null ? reason : "",
                        "ticketLink", ticketLink
                    );
                    return emailService.sendHtmlEmail(
                        recipientEmail,
                        "[Alumniverse] Vé đã bị hủy: " + event.getTitle(),
                        "eventTicketCancelled",
                        vars
                    );
                }));
        }

    private Mono<String> resolveTicketRecipientEmail(EventTicket ticket) {
        if (ticket.getGuestEmail() != null && StringUtils.hasText(ticket.getGuestEmail())) {
            return Mono.just(ticket.getGuestEmail().trim());
        }
        if (ticket.getMemberId() == null) {
            return Mono.empty();
        }
        return userProfileRepository.findAttendeeProfileByUserId(ticket.getMemberId().intValue())
                .map(UserProfileRepository.AttendeeProfile::email)
                .filter(StringUtils::hasText)
                .map(String::trim);
    }

    // ─── Step 6: Check-in (event-scoped, QR-encrypted, staff-only) ────────────

    /**
     * Check in a ticket for {@code eventId}. The caller supplies either the encrypted {@code qrToken}
     * scanned from the QR (preferred) or the raw ticket {@code code} (manual fallback). Both paths
     * enforce, server-side, that the ticket belongs to {@code eventId} ({@link ErrorCode#TICKET_WRONG_EVENT}),
     * and that the caller is staff. Returns the holder's profile so staff can verify the person.
     */
    public Mono<EventTicketDetailResponse> checkIn(Long eventId, CheckInRequest request) {
        return assertEventInCurrentOrg(eventId)
                .flatMap(event -> resolveTicketCode(eventId, request)
                        .flatMap(ticketCode -> this.findTicketByCode(ticketCode)
                                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.TICKET_NOT_FOUND, "Ticket not found")))
                                .flatMap(ticket -> {
                                    if (!eventId.equals(ticket.getEventId())) {
                                        return Mono.error(new ApplicationException(ErrorCode.TICKET_WRONG_EVENT, "Ticket does not belong to this event"));
                                    }
                                    boolean eventEnded = event.getEndTime() != null && event.getEndTime().isBefore(LocalDateTime.now());
                                    if (eventEnded && ticket.getStatus() == Status.ISSUED) {
                                        return ticketRepo.expireTicket(ticket.getId())
                                                .then(evictEventCaches())
                                                .then(Mono.error(new ApplicationException(ErrorCode.TICKET_EXPIRED, "Ticket has expired")));
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
                                    return this.checkInTicket(ticket.getId());
                                })))
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

    // ─── Ticket queries ───────────────────────────────────────────────────────

    public Mono<EventTicket> cancelTicket(String ticketCode, String reason) {
        if (reason == null || reason.isBlank()) {
            return Mono.error(new ApplicationException(ErrorCode.CANCEL_REASON_REQUIRED, "Cancel reason is required"));
        }
        return Mono.zip(
                        SecurityUtils.getCurrentUserId(),
                        this.findTicketByCode(ticketCode)
                                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.TICKET_NOT_FOUND, "Ticket not found"))))
                .flatMap(tuple -> {
                    Long currentUserId = tuple.getT1();
                    EventTicket ticket = tuple.getT2();
                    if (ticket.getStatus() == Status.CANCELLED) {
                        return Mono.error(new ApplicationException(ErrorCode.TICKET_ALREADY_CANCELLED, "Ticket already cancelled"));
                    }
                    boolean ownsTicket = ticket.getMemberId() != null && ticket.getMemberId().equals(currentUserId);
                    Mono<Void> permission = ownsTicket ? Mono.empty() : assertCanManageTicket(ticket);
                    return permission.then(this.cancelTicket(ticket.getId(), reason.trim()));
                });
    }

    public Mono<EventTicketDetailResponse> getTicketByCode(String ticketCode) {
        return Mono.zip(
                        SecurityUtils.getCurrentUserId(),
                        this.findTicketByCode(ticketCode)
                                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.TICKET_NOT_FOUND, "Ticket not found: " + ticketCode))))
                .flatMap(tuple -> {
                    Long currentUserId = tuple.getT1();
                    EventTicket ticket = tuple.getT2();
                    boolean ownsTicket = ticket.getMemberId() != null && ticket.getMemberId().equals(currentUserId);
                    Mono<Void> permission = ownsTicket ? Mono.empty() : assertCanManageTicket(ticket);
                    return permission.then(toDetailWithAttendee(ticket));
                });
    }

    public Mono<PaginatedResponse<EventTicketDetailResponse>> getTicketsByEvent(Long eventId, String status, String keyword, int page, int limit) {
        Mono<PaginatedResponse<EventTicket>> ticketsPage;
        if (keyword != null && !keyword.isBlank()) {
            ticketsPage = status != null
                    ? this.searchTicketsByEventAndStatus(eventId, status, keyword.trim(), page, limit)
                    : this.searchTicketsByEvent(eventId, keyword.trim(), page, limit);
        } else {
            ticketsPage = status != null
                    ? this.findTicketsByEventAndStatus(eventId, status, page, limit)
                    : this.findTicketsByEvent(eventId, page, limit);
        }
        return assertEventInCurrentOrg(eventId)
                .then(ticketsPage)
                .flatMap(ticketPage -> mapDetailPageWithAttendees(ticketPage, eventId));
    }

    public Mono<PaginatedResponse<EventTicketDetailResponse>> getMyTickets(int page, int limit) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(memberId -> this.findTicketsByMember(memberId, page, limit))
                .flatMap(this::mapDetailPage);
    }

    public Mono<PaginatedResponse<Event>> getMyInterestedEvents(int page, int limit) {
        int offset = page * limit;
        return SecurityUtils.getCurrentUserId()
                .flatMap(memberId -> interestRepo.findInterestedEventsByMember(memberId, limit, offset)
                        .collectList()
                        .zipWith(interestRepo.countByMemberId(memberId))
                        .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit)));
    }

    // ─── Ticket response mapping (qrToken + attendee enrichment) ──────────────

    /** Map a ticket to a response, additionally resolving the holder's profile for verification. */
    private Mono<EventTicketDetailResponse> toDetailWithAttendee(EventTicket ticket) {
        EventTicketDetailResponse.EventTicketDetailResponseBuilder builder = EventTicketDetailResponse.fromTicket(ticket)
                .qrToken(eventQrService.encodeWithPrefix(ticket.getTicketCode(), ticket.getEventId()));
        Mono<EventTicketDetailResponse.EventTicketDetailResponseBuilder> eventBuilder = enrichTicketEventTitle(ticket, builder);
        if (ticket.getMemberId() == null) {
            return eventBuilder.map(EventTicketDetailResponse.EventTicketDetailResponseBuilder::build);
        }
        return eventBuilder.flatMap(enrichedBuilder -> userProfileRepository.findAttendeeProfileByUserId(ticket.getMemberId().intValue())
                .map(profile -> enrichedBuilder
                        .attendeeName(profile.fullName())
                        .attendeeEmail(profile.email())
                        .attendeeAvatarUrl(profile.avatarUrl())
                        .build())
                .defaultIfEmpty(enrichedBuilder.build()));
    }

    private Mono<EventTicketDetailResponse.EventTicketDetailResponseBuilder> enrichTicketEventTitle(
            EventTicket ticket,
            EventTicketDetailResponse.EventTicketDetailResponseBuilder builder
    ) {
        if (ticket.getEventId() == null) {
            return Mono.just(builder);
        }
        return this.findEventById(ticket.getEventId())
                .map(event -> builder.eventTitle(event.getTitle()))
                .defaultIfEmpty(builder);
    }

    /** Build a ticket detail from pre-loaded maps (no per-row DB calls). */
    private EventTicketDetailResponse buildTicketDetail(EventTicket ticket, Map<Long, Event> events,
                                                        Map<Integer, UserProfileRepository.AttendeeProfile> profiles) {
        return buildTicketDetail(ticket, events, profiles, null);
    }

    private EventTicketDetailResponse buildTicketDetail(EventTicket ticket, Map<Long, Event> events,
                                                        Map<Integer, UserProfileRepository.AttendeeProfile> profiles,
                                                        Set<Long> latestTicketIds) {
        EventTicketDetailResponse.EventTicketDetailResponseBuilder builder = EventTicketDetailResponse.fromTicket(ticket)
                .qrToken(eventQrService.encodeWithPrefix(ticket.getTicketCode(), ticket.getEventId()));
        if (latestTicketIds != null) {
            builder.latestForOwner(latestTicketIds.contains(ticket.getId()));
        }
        if (ticket.getEventId() != null) {
            Event event = events.get(ticket.getEventId());
            if (event != null && event.getTitle() != null) builder.eventTitle(event.getTitle());
        }
        if (ticket.getMemberId() != null) {
            UserProfileRepository.AttendeeProfile profile = profiles.get(ticket.getMemberId().intValue());
            if (profile != null) {
                builder.attendeeName(profile.fullName())
                        .attendeeEmail(profile.email())
                        .attendeeAvatarUrl(profile.avatarUrl());
            }
        }
        return builder.build();
    }

    private Mono<PaginatedResponse<EventTicketDetailResponse>> mapDetailPage(PaginatedResponse<EventTicket> page) {
        Set<Long> eventIds = new HashSet<>();
        for (EventTicket t : page.getItems()) {
            if (t.getEventId() != null) eventIds.add(t.getEventId());
        }
        return eventsById(eventIds)
                .map(events -> withItems(page, page.getItems().stream()
                        .map(t -> buildTicketDetail(t, events, Map.of()))
                        .toList()));
    }

    private Mono<PaginatedResponse<EventTicketDetailResponse>> mapDetailPageWithAttendees(PaginatedResponse<EventTicket> page, Long eventId) {
        Set<Long> eventIds = new HashSet<>();
        Set<Integer> memberIds = new HashSet<>();
        for (EventTicket t : page.getItems()) {
            if (t.getEventId() != null) eventIds.add(t.getEventId());
            if (t.getMemberId() != null) memberIds.add(t.getMemberId().intValue());
        }
        Mono<Set<Long>> latestIds = ticketRepo.findLatestTicketPerOwner(eventId)
                .map(EventTicket::getId)
                .collect(java.util.stream.Collectors.toSet());
        return Mono.zip(eventsById(eventIds), userProfileRepository.findAttendeeProfilesByUserIds(memberIds), latestIds)
                .map(tuple -> withItems(page, page.getItems().stream()
                        .map(t -> buildTicketDetail(t, tuple.getT1(), tuple.getT2(), tuple.getT3()))
                        .toList()));
    }

    /** Batch-load events by id in one query; empty set short-circuits without hitting the DB. */
    private Mono<Map<Long, Event>> eventsById(Set<Long> eventIds) {
        if (eventIds.isEmpty()) return Mono.just(Map.of());
        return eventRepo.findAllById(eventIds).collectMap(Event::getId, e -> e);
    }

    /** Rebuild a paginated response with new items, carrying over the paging metadata. */
    private <T> PaginatedResponse<T> withItems(PaginatedResponse<?> page, List<T> items) {
        return PaginatedResponse.<T>builder()
                .items(items)
                .currentPage(page.getCurrentPage())
                .pageSize(page.getPageSize())
                .totalPage(page.getTotalPage())
                .totalItem(page.getTotalItem())
                .hasNext(page.getHasNext())
                .hasPrevious(page.getHasPrevious())
                .build();
    }

    // ─── Invitation queries ───────────────────────────────────────────────────

    public Mono<PaginatedResponse<EventInvitationDetailResponse>> getInvitationsByEvent(Long eventId, int page, int limit) {
        return assertEventInCurrentOrg(eventId)
                .then(this.findInvitationsByEvent(eventId, page, limit))
                .flatMap(this::mapInvitationPageWithMembers);
    }

    // ─── Email log queries ────────────────────────────────────────────────────

    public Mono<PaginatedResponse<EventEmailLog>> getEmailLogsByEvent(Long eventId, int page, int limit) {
        return assertEventInCurrentOrg(eventId)
                .then(this.findEmailLogsByEvent(eventId, page, limit));
    }

    private EventInterestDetailResponse buildInterestDetail(EventInterest interest,
                                                            Map<Integer, UserProfileRepository.AttendeeProfile> profiles) {
        EventInterestDetailResponse.EventInterestDetailResponseBuilder builder = EventInterestDetailResponse.fromInterest(interest);
        if (interest.getMemberId() != null) {
            UserProfileRepository.AttendeeProfile profile = profiles.get(interest.getMemberId().intValue());
            if (profile != null) {
                builder.memberName(profile.fullName())
                        .memberEmail(profile.email())
                        .memberAvatarUrl(profile.avatarUrl());
            }
        }
        return builder.build();
    }

    private Mono<PaginatedResponse<EventInterestDetailResponse>> mapInterestPageWithMembers(PaginatedResponse<EventInterest> page) {
        Set<Integer> memberIds = new HashSet<>();
        for (EventInterest i : page.getItems()) {
            if (i.getMemberId() != null) memberIds.add(i.getMemberId().intValue());
        }
        return userProfileRepository.findAttendeeProfilesByUserIds(memberIds)
                .map(profiles -> withItems(page, page.getItems().stream()
                        .map(i -> buildInterestDetail(i, profiles))
                        .toList()));
    }

    private EventInvitationDetailResponse buildInvitationDetail(EventInvitation invitation,
                                                                Map<Integer, UserProfileRepository.AttendeeProfile> profiles) {
        EventInvitationDetailResponse.EventInvitationDetailResponseBuilder builder = EventInvitationDetailResponse.fromInvitation(invitation);
        if (invitation.getMemberId() != null) {
            UserProfileRepository.AttendeeProfile profile = profiles.get(invitation.getMemberId().intValue());
            if (profile != null) {
                builder.memberName(profile.fullName())
                        .memberEmail(profile.email())
                        .memberAvatarUrl(profile.avatarUrl());
            }
        }
        return builder.build();
    }

    private Mono<PaginatedResponse<EventInvitationDetailResponse>> mapInvitationPageWithMembers(PaginatedResponse<EventInvitation> page) {
        Set<Integer> memberIds = new HashSet<>();
        for (EventInvitation inv : page.getItems()) {
            if (inv.getMemberId() != null) memberIds.add(inv.getMemberId().intValue());
        }
        return userProfileRepository.findAttendeeProfilesByUserIds(memberIds)
                .map(profiles -> withItems(page, page.getItems().stream()
                        .map(inv -> buildInvitationDetail(inv, profiles))
                        .toList()));
    }

    // ─── Statistics ───────────────────────────────────────────────────────────

    public Mono<EventStatisticsResponse> getEventStatistics(Long eventId) {
        return this.findEventById(eventId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found: " + eventId)))
                .flatMap(e -> {
                    // This endpoint is public; a draft (unpublished) event's stats must not leak.
                    // Only a manager of the owning org may see stats for an unpublished event.
                    if (Boolean.TRUE.equals(e.getIsPublished())) {
                        return this.daoGetEventStatistics(eventId);
                    }
                    return SecurityUtils.canManageContentOrganization(e.getOrganizationId())
                            .flatMap(canManage -> Boolean.TRUE.equals(canManage)
                                    ? this.daoGetEventStatistics(eventId)
                                    : Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found: " + eventId)));
                });
    }

    private Mono<Void> assertEventOpenForRegistration(Event event) {
        LocalDateTime now = LocalDateTime.now();
        if (!Boolean.TRUE.equals(event.getIsPublished())) {
            return Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_PUBLISHED));
        }
        if (event.getRegistrationStartAt() != null && now.isBefore(event.getRegistrationStartAt())) {
            return Mono.error(new ApplicationException(ErrorCode.EVENT_REGISTRATION_NOT_OPEN));
        }
        if ((event.getRegistrationEndAt() != null && now.isAfter(event.getRegistrationEndAt()))
                || (event.getStartTime() != null && !now.isBefore(event.getStartTime()))) {
            return Mono.error(new ApplicationException(ErrorCode.EVENT_REGISTRATION_CLOSED));
        }
        return SecurityUtils.getCurrentOrganizationId()
                .filter(orgId -> event.getOrganizationId() != null
                        && event.getOrganizationId().equals(orgId.longValue()))
                .switchIfEmpty(Mono.error(new ApplicationException(
                        ErrorCode.FORBIDDEN,
                        "Event does not belong to the current organization")))
                .then();
    }

    // ─── Event questions ──────────────────────────────────────────────────────

    public Flux<EventQuestionResponse> getVisibleEventQuestions(Long eventId, Integer organizationId) {
        return getVisibleEventById(eventId, organizationId)
                .thenMany(this.findQuestionsByEvent(eventId).map(EventQuestionResponse::from));
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
                    return this.createQuestion(question).map(EventQuestionResponse::from);
                });
    }

    public Mono<EventQuestionResponse> updateEventQuestion(Long eventId, Integer questionId, EventQuestionRequest request) {
        return assertEventInCurrentOrg(eventId)
                .flatMap(event -> this.findQuestionById(questionId)
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
                            return this.updateQuestion(questionId, updated).map(EventQuestionResponse::from);
                        }));
    }

    public Mono<Boolean> deleteEventQuestion(Long eventId, Integer questionId) {
        return assertEventInCurrentOrg(eventId)
                .flatMap(event -> this.deleteQuestion(eventId, questionId));
    }

    public Mono<Boolean> reorderEventQuestions(Long eventId, ReorderEventQuestionsRequest request) {
        return assertEventInCurrentOrg(eventId)
                .flatMap(event -> this.reorderQuestions(eventId, request.getQuestionIds()));
    }

    private Mono<Event> assertEventInCurrentOrg(Long eventId) {
        return this.findEventById(eventId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND, "Event not found: " + eventId)))
                .flatMap(event -> SecurityUtils.assertCanManageContentOrganization(event.getOrganizationId())
                        .thenReturn(event));
    }

    private Mono<Void> assertCanManageTicket(EventTicket ticket) {
        if (ticket.getEventId() == null) {
            return Mono.error(new ApplicationException(ErrorCode.FORBIDDEN, "Ticket is not linked to an event"));
        }
        return assertEventInCurrentOrg(ticket.getEventId()).then();
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

// ─── Event CRUD ───────────────────────────────────────────────────────────


    private Mono<Event> createEvent(Event eventData) {
        eventData.setCreatedAt(LocalDateTime.now());
        eventData.setIsPublished(false);
        eventData.setInterestedCount(0);
        return eventRepo.save(eventData)
                .delayUntil(e -> evictEventCaches());
    }

    private Mono<Event> updateEvent(Long eventId, Event eventData) {
        return eventRepo.findById(eventId)
                .flatMap(existing -> {
                    existing.setTitle(eventData.getTitle());
                    existing.setDescription(eventData.getDescription());
                    existing.setBannerUrl(eventData.getBannerUrl());
                    existing.setLocation(eventData.getLocation());
                    existing.setStartTime(eventData.getStartTime());
                    existing.setEndTime(eventData.getEndTime());
                    existing.setRegistrationStartAt(eventData.getRegistrationStartAt());
                    existing.setRegistrationEndAt(eventData.getRegistrationEndAt());
                    existing.setMaxCapacity(eventData.getMaxCapacity());
                    if (eventData.getTopic() != null) existing.setTopic(eventData.getTopic());
                    return eventRepo.save(existing);
                })
                .delayUntil(e -> evictEventCaches());
    }

    private Mono<Boolean> daoDeleteEvent(Long eventId) {
        return eventRepo.deleteById(eventId)
                .then(evictEventCaches())
                .thenReturn(true);
    }

    private Mono<Event> findEventById(Long eventId) {
        return eventRepo.findById(eventId);
    }

    // ─── Publishing ───────────────────────────────────────────────────────────

    private Mono<Event> daoPublishEvent(Long eventId) {
        return eventRepo.publishEvent(eventId).then(eventRepo.findById(eventId))
                .delayUntil(e -> evictEventCaches());
    }

    private Mono<Event> daoUnpublishEvent(Long eventId) {
        return eventRepo.unpublishEvent(eventId).then(eventRepo.findById(eventId))
                .delayUntil(e -> evictEventCaches());
    }

    // ─── Search & Filter ──────────────────────────────────────────────────────

    private Mono<PaginatedResponse<Event>> findUpcomingEvents(Long organizationId, int page, int limit) {
        int offset = page * limit;
        LocalDateTime now = LocalDateTime.now();
        return PaginationHelper.paginate(
                eventRepo.findUpcomingEvents(organizationId, now, limit, offset).collectList(),
                eventRepo.countUpcomingEvents(organizationId, now),
                page,
                limit
        );
    }

    private Mono<PaginatedResponse<Event>> findOngoingEvents(Long organizationId, int page, int limit) {
        int offset = page * limit;
        LocalDateTime now = LocalDateTime.now();
        return PaginationHelper.paginate(
                eventRepo.findOngoingEvents(organizationId, now, limit, offset).collectList(),
                eventRepo.countOngoingEvents(organizationId, now),
                page,
                limit
        );
    }

    private Mono<PaginatedResponse<Event>> findPastEvents(Long organizationId, int page, int limit) {
        int offset = page * limit;
        LocalDateTime now = LocalDateTime.now();
        return PaginationHelper.paginate(
                eventRepo.findPastEvents(organizationId, now, limit, offset).collectList(),
                eventRepo.countPastEvents(organizationId, now),
                page,
                limit
        );
    }

    private Mono<PaginatedResponse<Event>> daoSearchEvents(Long organizationId, String keyword, int page, int limit) {
        int offset = page * limit;
        return PaginationHelper.paginate(
                eventRepo.searchEvents(organizationId, keyword, limit, offset).collectList(),
                eventRepo.countSearchEvents(organizationId, keyword),
                page,
                limit
        );
    }

    // ─── Interest ─────────────────────────────────────────────────────────────

    private Mono<EventInterest> addEventInterest(Long eventId, Long memberId) {
        EventInterest interest = EventInterest.builder()
                .eventId(eventId)
                .memberId(memberId)
                .createdAt(LocalDateTime.now())
                .build();
        return interestRepo.save(interest)
                .flatMap(saved -> eventRepo.incrementInterestedCount(eventId).thenReturn(saved))
                .delayUntil(saved -> evictEventCaches());
    }

    private Mono<Boolean> removeEventInterest(Long eventId, Long memberId) {
        return interestRepo.deleteByEventIdAndMemberId(eventId, memberId)
                .then(eventRepo.decrementInterestedCount(eventId))
                .then(evictEventCaches())
                .thenReturn(true);
    }

    private Mono<PaginatedResponse<EventInterest>> findEventInterests(Long eventId, int page, int limit) {
        int offset = page * limit;
        return interestRepo.findByEventIdWithPagination(eventId, limit, offset)
                .collectList()
                .zipWith(interestRepo.countByEventId(eventId))
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit));
    }

    private Mono<Boolean> checkUserInterest(Long eventId, Long memberId) {
        return interestRepo.existsByEventIdAndMemberId(eventId, memberId);
    }

    private Mono<Boolean> checkUserRegistered(Long eventId, Long memberId) {
        // Only a non-cancelled/expired/rejected ticket counts as registered, so
        // a cancelled registration correctly reads as not-registered.
        return ticketRepo.existsActiveByEventIdAndMemberId(eventId, memberId);
    }
    // ─── Ticket — register ────────────────────────────────────────────────────

    private Mono<EventTicket> registerTicket(EventTicket ticketData) {
        ticketData.setTicketCode(UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        ticketData.setStatus(Status.ISSUED);
        ticketData.setRegisteredAt(LocalDateTime.now());
        // Covers self-register and invitation-confirm flows: both issue a ticket
        // here, so admin_event_statistics ticket counts must be invalidated.
        return ticketRepo.save(ticketData)
                .delayUntil(saved -> evictEventCaches());
    }

    private Mono<Boolean> hasRegistered(Long eventId, Long memberId) {
        // Allow re-registering after a cancellation: a cancelled ticket no
        // longer blocks a new registration.
        return ticketRepo.existsActiveByEventIdAndMemberId(eventId, memberId);
    }

    // ─── Ticket — issue ───────────────────────────────────────────────────────

    private Flux<EventTicket> findIssuedTicketsByEvent(Long eventId) {
        return ticketRepo.findIssuedTicketsByEventId(eventId);
    }

    // ─── Ticket — lifecycle ───────────────────────────────────────────────────

    private Mono<EventTicket> cancelTicket(Long ticketId, String reason) {
        return ticketRepo.cancelTicket(ticketId, reason)
            .then(ticketRepo.findById(ticketId))
            .doOnNext(ticket -> {
                // Email hủy vé là best-effort: gửi nền, không chặn response.
                if (ticket.getEventId() != null) {
                    sendTicketCancellationEmailAsync(ticket, reason);
                }
            })
            .delayUntil(ticket -> evictEventCaches());
    }

    private void sendTicketCancellationEmailAsync(EventTicket ticket, String reason) {
        this.findEventById(ticket.getEventId())
                .flatMap(event -> sendTicketCancellationEmail(event, ticket, reason))
                .subscribe(
                        v -> {},
                        e -> log.warn("Failed to send ticket cancellation email for event {} ticket {}: {}",
                                ticket.getEventId(), ticket.getTicketCode(), e.getMessage()));
    }

    private Mono<EventTicket> checkInTicket(Long ticketId) {
        return ticketRepo.checkInTicket(ticketId, LocalDateTime.now())
                .then(ticketRepo.findById(ticketId))
                .delayUntil(ticket -> evictEventCaches());
    }

    // ─── Ticket — query ───────────────────────────────────────────────────────

    private Mono<EventTicket> findTicketByCode(String ticketCode) {
        return ticketRepo.findByTicketCode(ticketCode);
    }


    private Flux<EventTicket> findTicketsByIds(Iterable<Long> ticketIds) {
        return ticketRepo.findAllById(ticketIds);
    }

    private Mono<PaginatedResponse<EventTicket>> findTicketsByEvent(Long eventId, int page, int limit) {
        int offset = page * limit;
        return ticketRepo.findByEventIdWithPagination(eventId, limit, offset)
                .collectList()
                .zipWith(ticketRepo.countByEventId(eventId))
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit));
    }

    private Mono<PaginatedResponse<EventTicket>> findTicketsByEventAndStatus(Long eventId, String status, int page, int limit) {
        int offset = page * limit;
        return ticketRepo.findByEventIdAndStatusWithPagination(eventId, status, limit, offset)
                .collectList()
                .zipWith(ticketRepo.countByEventIdAndStatus(eventId, status))
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit));
    }

    private Mono<PaginatedResponse<EventTicket>> searchTicketsByEvent(Long eventId, String keyword, int page, int limit) {
        int offset = page * limit;
        return ticketRepo.searchByEventId(eventId, keyword, limit, offset)
                .collectList()
                .zipWith(ticketRepo.countSearchByEventId(eventId, keyword))
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit));
    }

    private Mono<PaginatedResponse<EventTicket>> searchTicketsByEventAndStatus(Long eventId, String status, String keyword, int page, int limit) {
        int offset = page * limit;
        return ticketRepo.searchByEventIdAndStatus(eventId, status, keyword, limit, offset)
                .collectList()
                .zipWith(ticketRepo.countSearchByEventIdAndStatus(eventId, status, keyword))
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit));
    }

    private Mono<PaginatedResponse<EventTicket>> findTicketsByMember(Long memberId, int page, int limit) {
        int offset = page * limit;
        return ticketRepo.findByMemberIdWithPagination(memberId, limit, offset)
                .collectList()
                .zipWith(ticketRepo.countByMemberId(memberId))
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit));
    }

    private Mono<Long> countRegisteredTickets(Long eventId) {
        return ticketRepo.countActiveRegistrations(eventId);
    }

    // ─── Invitations ──────────────────────────────────────────────────────────

    private Mono<EventInvitation> createInvitation(EventInvitation invitation) {
        invitation.setStatus(Status.PENDING);
        invitation.setInvitedAt(LocalDateTime.now());
        return invitationRepo.save(invitation);
    }

    private Mono<EventInvitation> findInvitationByToken(String token) {
        return invitationRepo.findByToken(token);
    }

    private Mono<EventInvitation> confirmInvitation(Long invitationId) {
        return invitationRepo.confirmInvitation(invitationId, LocalDateTime.now())
                .then(invitationRepo.findById(invitationId));
    }

    private Mono<PaginatedResponse<EventInvitation>> findInvitationsByEvent(Long eventId, int page, int limit) {
        int offset = page * limit;
        return invitationRepo.findByEventIdWithPagination(eventId, limit, offset)
                .collectList()
                .zipWith(invitationRepo.countByEventId(eventId))
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit));
    }

    // ─── Email logs ───────────────────────────────────────────────────────────

    private Mono<EventEmailLog> saveEmailLog(EventEmailLog log) {
        log.setSentAt(LocalDateTime.now());
        return emailLogRepo.save(log);
    }

    private Mono<PaginatedResponse<EventEmailLog>> findEmailLogsByEvent(Long eventId, int page, int limit) {
        int offset = page * limit;
        return emailLogRepo.findByEventIdWithPagination(eventId, limit, offset)
                .collectList()
                .zipWith(emailLogRepo.countByEventId(eventId))
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit));
    }

    // ─── Statistics ───────────────────────────────────────────────────────────

    private Mono<EventStatisticsResponse> daoGetEventStatistics(Long eventId) {
        return eventRepo.findById(eventId)
                .zipWith(ticketRepo.countActiveRegistrations(eventId))
                .zipWith(ticketRepo.countByEventIdAndStatus(eventId, Status.USED.getValue()))
                .zipWith(ticketRepo.countByEventIdAndStatus(eventId, Status.CHECKED_IN.getValue()))
                .map(tuple -> {
                    Event event = tuple.getT1().getT1().getT1();
                    Long registeredCount = tuple.getT1().getT1().getT2();
                    Long usedCount = tuple.getT1().getT2();
                    Long checkedInCount = tuple.getT2();

                    return EventStatisticsResponse.builder()
                            .eventId(eventId)
                            .interestedCount(event.getInterestedCount())
                            .registeredCount(registeredCount)
                            .checkedInCount(usedCount + checkedInCount)
                            .maxCapacity(event.getMaxCapacity())
                            .availableSlots(event.getMaxCapacity() != null
                                    ? event.getMaxCapacity() - registeredCount
                                    : null)
                            .build();
                });
    }

    // ─── Event questions ──────────────────────────────────────────────────────

    private Flux<EventQuestion> findQuestionsByEvent(Long eventId) {
        return questionRepo.findByEventIdOrderByOrderIndex(eventId);
    }

    private Mono<EventQuestion> findQuestionById(Integer questionId) {
        return questionRepo.findById(questionId);
    }

    private Mono<EventQuestion> createQuestion(EventQuestion question) {
        if (question.getOrderIndex() == null) question.setOrderIndex(0);
        if (question.getRequired() == null) question.setRequired(false);
        question.setCreatedAt(LocalDateTime.now());
        return questionRepo.save(question);
    }

    private Mono<EventQuestion> updateQuestion(Integer questionId, EventQuestion questionData) {
        return questionRepo.findById(questionId)
                .flatMap(existing -> {
                    existing.setType(questionData.getType());
                    existing.setLabel(questionData.getLabel());
                    existing.setOptions(questionData.getOptions());
                    existing.setRequired(questionData.getRequired());
                    if (questionData.getOrderIndex() != null) {
                        existing.setOrderIndex(questionData.getOrderIndex());
                    }
                    return questionRepo.save(existing);
                });
    }

    private Mono<Boolean> deleteQuestion(Long eventId, Integer questionId) {
        return questionRepo.deleteByIdAndEventId(questionId, eventId).map(rows -> rows > 0);
    }

    private Mono<Boolean> reorderQuestions(Long eventId, java.util.List<Integer> questionIds) {
        if (questionIds == null || questionIds.isEmpty()) return Mono.just(true);
        Map<Integer, Integer> orderByQuestionId = new HashMap<>();
        for (int i = 0; i < questionIds.size(); i++) {
            orderByQuestionId.put(questionIds.get(i), i);
        }
        // Load all questions in one IN query, keep only those owned by this event, then persist in one batch.
        return questionRepo.findAllById(questionIds)
                .filter(q -> eventId.equals(q.getEventId()))
                .doOnNext(q -> q.setOrderIndex(orderByQuestionId.get(q.getId())))
                .collectList()
                .flatMap(questions -> questionRepo.saveAll(questions).then(Mono.just(true)));
    }

}
