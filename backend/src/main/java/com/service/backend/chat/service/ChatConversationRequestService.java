package com.service.backend.chat.service;

import com.service.backend.chat.dao.ChatConversationRequestRepository;
import com.service.backend.chat.dao.ChatGroupMemberRepository;
import com.service.backend.chat.dao.ChatGroupRepository;
import com.service.backend.chat.dao.ChatMessageRepository;
import com.service.backend.chat.dto.ConversationRequestConnectionStatusResponse;
import com.service.backend.chat.dto.ConversationRequestLatestMessageResponse;
import com.service.backend.chat.dto.ConversationRequestSearchItemResponse;
import com.service.backend.chat.dto.RespondConversationRequestResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.utils.PaginationHelper;
import com.service.backend.shared.entity.ChatConversationRequest;
import com.service.backend.shared.entity.ChatGroup;
import com.service.backend.shared.entity.ChatGroupMember;
import com.service.backend.shared.entity.ChatMessage;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.enums.ConversationRequestStatus;
import com.service.backend.shared.service.SseService;
import com.service.backend.user.dao.UserProfileRepository;
import com.service.backend.user.service.NotificationService;


import com.service.backend.shared.enums.ChatType;
import com.service.backend.shared.enums.ChatRole;
import com.service.backend.shared.exception.ApplicationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.reactive.TransactionalOperator;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatConversationRequestService {

    private final ChatConversationRequestRepository chatConversationRequestRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatGroupRepository chatGroupRepository;
    private final ChatGroupMemberRepository chatGroupMemberRepository;
    private final UserBlockService userBlockService;
    private final UserProfileRepository userProfileRepository;
    private final NotificationService notificationService;
    private final SseService sseService;
    private final TransactionalOperator transactionalOperator;

    /**
     * Returns connection status and the current member's latest message in the request chat group,
     * plus whether the target is verified in the requester's current organization. {@code status} is
     * null when no conversation request exists yet for the pair, but the response itself is always
     * present so the frontend can gate composing before a request is ever created.
     */
    public Mono<ConversationRequestConnectionStatusResponse> getConnectionStatus(
            Long currentMemberId,
            Long targetMemberId) {
        if (currentMemberId == null || targetMemberId == null) {
            return Mono.error(new ApplicationException(ErrorCode.USER_NOT_FOUND, "Member IDs must not be null"));
        }

        if (currentMemberId.equals(targetMemberId)) {
            return Mono.error(new ApplicationException(
                    ErrorCode.USER_NOT_FOUND,
                    "Cannot check conversation request status with yourself"));
        }

        long memberLowId = Math.min(currentMemberId, targetMemberId);
        long memberHighId = Math.max(currentMemberId, targetMemberId);

        // The network directory (/api/chat/network/members) spans every organization, so a member
        // may legitimately connect with someone outside their own JWT organization. There is no
        // per-organization verification gate on connection requests, so this only reports the
        // existing request status (if any) between the two members.
        return chatConversationRequestRepository
                .findByMemberPair(memberLowId, memberHighId)
                .flatMap(request -> buildConnectionStatusResponse(request, currentMemberId))
                .defaultIfEmpty(new ConversationRequestConnectionStatusResponse(null, null, null, false));
    }

    private Mono<ConversationRequestConnectionStatusResponse> buildConnectionStatusResponse(
            ChatConversationRequest request,
            Long currentMemberId) {
        return chatMessageRepository
                .findLatestByGroupIdAndSenderMemberId(request.getChatGroupId(), currentMemberId)
                .map(message -> toConnectionStatusResponse(request, message, currentMemberId))
                .defaultIfEmpty(toConnectionStatusResponse(request, null, currentMemberId));
    }

    private ConversationRequestConnectionStatusResponse toConnectionStatusResponse(
            ChatConversationRequest request,
            ChatMessage message,
            Long currentMemberId) {
        // "incoming" means the other member sent this still-pending request to the current user,
        // so sending back will auto-accept (see handleExistingRequest).
        boolean incoming = request.getStatus() == ConversationRequestStatus.PENDING
                && currentMemberId.equals(request.getTargetMemberId());
        return new ConversationRequestConnectionStatusResponse(
                request.getStatus(),
                request.getCooldownUntil(),
                message != null ? toLatestMessageResponse(message) : null,
                incoming);
    }

    private ConversationRequestLatestMessageResponse toLatestMessageResponse(ChatMessage message) {
        return new ConversationRequestLatestMessageResponse(
                message.getId(),
                message.getGroupId(),
                message.getSenderMemberId(),
                message.getContent(),
                message.getCreatedAt(),
                message.getEditedAt());
    }

    /**
     * Accepts or rejects an incoming conversation request on behalf of the target member.
     * On ACCEPTED, both members are added to the private chat group after the status update.
     * On REJECTED, {@code cooldown_until} is set to now + 7 days.
     */
    @Transactional
    public Mono<RespondConversationRequestResponse> respondToConversationRequest(
            Long currentMemberId,
            Long requestId,
            ConversationRequestStatus requestedStatus) {

        return chatConversationRequestRepository.findById(requestId)
                .switchIfEmpty(Mono.error(new ApplicationException(
                        ErrorCode.CONVERSATION_REQUEST_NOT_FOUND,
                        "Conversation request not found: " + requestId)))
                .flatMap(request -> validateRespondAuthorization(currentMemberId, request)
                        .then(applyConversationRequestResponse(request, requestedStatus))
                        .flatMap(this::buildRespondResponse));
    }

    private Mono<Void> validateRespondAuthorization(Long currentMemberId, ChatConversationRequest request) {
        if (!currentMemberId.equals(request.getTargetMemberId())) {
            return Mono.error(new ApplicationException(
                    ErrorCode.CONVERSATION_REQUEST_NOT_RECIPIENT,
                    "Only the request recipient can respond to this conversation request"));
        }
        return Mono.empty();
    }

    private Mono<ChatConversationRequest> applyConversationRequestResponse(
            ChatConversationRequest request,
            ConversationRequestStatus requestedStatus) {

        ConversationRequestStatus currentStatus = request.getStatus();

        if (currentStatus == ConversationRequestStatus.ACCEPTED && requestedStatus == ConversationRequestStatus.ACCEPTED) {
            return Mono.error(new ApplicationException(
                    ErrorCode.CONVERSATION_REQUEST_ALREADY_ACCEPTED,
                    "These two members are already connected"));
        }

        if (currentStatus != ConversationRequestStatus.PENDING) {
            return Mono.error(new ApplicationException(
                    ErrorCode.CONVERSATION_REQUEST_NOT_PENDING,
                    "Conversation request is no longer pending"));
        }

        LocalDateTime now = LocalDateTime.now();
        request.setStatus(requestedStatus);
        request.setUpdatedAt(now);

        if (requestedStatus == ConversationRequestStatus.REJECTED) {
            request.setCooldownUntil(now.plusDays(7));
        } else { // Cái này là ACCEPTED
            request.setCooldownUntil(null);
        }

        return chatConversationRequestRepository.save(request)
                .flatMap(saved -> {
                    if (requestedStatus == ConversationRequestStatus.REJECTED) {
                        log.info("Conversation request rejected: id={}, target={}",
                                saved.getId(), saved.getTargetMemberId());
                        return Mono.just(saved);
                    }

                    return chatGroupRepository.findById(saved.getChatGroupId())
                            .switchIfEmpty(Mono.error(new ApplicationException(
                                    ErrorCode.RESOURCES_NOT_FOUND,
                                    "Chat group not found for conversation request: " + saved.getChatGroupId())))
                            .flatMap(group -> addBothMembersToGroup(
                                    group,
                                    saved.getRequesterMemberId(),
                                    saved.getTargetMemberId())
                                    .thenReturn(saved))
                            .doOnSuccess(updated -> log.info(
                                    "Conversation request accepted: id={}, requester={}, target={}",
                                    updated.getId(),
                                    updated.getRequesterMemberId(),
                                    updated.getTargetMemberId()));
                });
    }

    private Mono<RespondConversationRequestResponse> buildRespondResponse(ChatConversationRequest request) {
        return chatMessageRepository.findById(request.getLastRequestMessageId())
                .map(message -> new RespondConversationRequestResponse(
                        request.getStatus(),
                        message.getContent()))
                .defaultIfEmpty(new RespondConversationRequestResponse(
                        request.getStatus(),
                        null));
    }

    /**
     * Creates a new conversation request between the current member and a target member.
     * Allocates a dedicated private chat group, inserts the initial message, and records
     * the request with status PENDING. Cooldown is only set when the request is rejected.
     *
     * <p>The mutation runs inside a programmatic transaction (via {@link TransactionalOperator})
     * rather than {@code @Transactional} so the concurrent-conflict retry can live OUTSIDE the
     * transaction: a competing send may win the {@code (member_low_id, member_high_id)} unique
     * index, which aborts the current transaction — re-querying inside it is impossible
     * ("current transaction is aborted"). On that conflict we retry once in a fresh transaction,
     * where {@code findByMemberPair} now sees the winner's row and short-circuits with the proper
     * 4xx via {@code handleExistingRequest} (or re-sends if it was a rejected, cooled-down pair).
     */
    public Mono<Long> createConversationRequest(
            Long currentMemberId,
            Long targetMemberId,
            String message) {

        if (currentMemberId.equals(targetMemberId)) {
            return Mono.error(new ApplicationException(
                    ErrorCode.BAD_REQUEST,
                    "Cannot send a conversation request to yourself"));
        }

        return assertTargetActive(targetMemberId)
                .then(userBlockService.assertCommunicationNotBlocked(currentMemberId, targetMemberId))
                .then(createConversationRequestAfterBlockCheck(currentMemberId, targetMemberId, message)
                        .as(transactionalOperator::transactional))
                .onErrorResume(DataIntegrityViolationException.class, error ->
                        createConversationRequestAfterBlockCheck(currentMemberId, targetMemberId, message)
                                .as(transactionalOperator::transactional));
    }

    private Mono<Void> assertTargetActive(Long targetMemberId) {
        return chatConversationRequestRepository.existsActiveUserById(targetMemberId)
                .flatMap(active -> active
                        ? Mono.empty()
                        : Mono.error(new ApplicationException(
                                ErrorCode.USER_NOT_FOUND,
                                "Target member is not active")));
    }

    private Mono<Long> createConversationRequestAfterBlockCheck(
            Long currentMemberId,
            Long targetMemberId,
            String message) {

        long memberLowId = Math.min(currentMemberId, targetMemberId);
        long memberHighId = Math.max(currentMemberId, targetMemberId);

        // A concurrent send can win the (member_low_id, member_high_id) unique index between the
        // findByMemberPair read below and the insert, making the insert throw
        // DataIntegrityViolationException. That error aborts this transaction, so it cannot be
        // recovered here — it propagates to createConversationRequest, which retries the whole
        // flow in a fresh transaction (see that method's javadoc).
        return chatConversationRequestRepository.findByMemberPair(memberLowId, memberHighId)
                .flatMap(existing -> handleExistingRequest(existing, currentMemberId, targetMemberId, message))
                .switchIfEmpty(
                        createPrivateChatGroup(currentMemberId)
                                .flatMap(savedGroup -> insertInitialMessage(savedGroup.getId(), currentMemberId, message)
                                        .flatMap(savedMessage -> saveConversationRequest(
                                                memberLowId, memberHighId, currentMemberId, targetMemberId,
                                                savedGroup.getId(), savedMessage.getId(), ConversationRequestStatus.PENDING))
                                        .map(savedRequest -> {
                                            log.info("Conversation request created: id={}, requester={}, target={}",
                                                    savedRequest.getId(), currentMemberId, targetMemberId);
                                            return savedRequest.getId();
                                        }))
                                // Brand-new request → notify the recipient of the incoming request.
                                // The existing-request paths handle their own notification: the
                                // post-cooldown re-send notifies as a fresh request, while the mutual
                                // auto-accept and the error cases (already pending/accepted/cooldown)
                                // do not send a "new request" notification.
                                .flatMap(requestId -> notifyTargetOfIncomingRequest(currentMemberId, targetMemberId)
                                        .thenReturn(requestId)));
    }

    /**
     * Notifies the recipient that {@code requesterMemberId} sent them a connection request:
     * persists a bell notification (+ FCM push) and pushes a realtime {@code connection-request}
     * SSE event so an online recipient sees it instantly. Best-effort — any failure here is
     * logged and swallowed so it can never roll back or fail the request that was just created.
     */
    private Mono<Void> notifyTargetOfIncomingRequest(Long requesterMemberId, Long targetMemberId) {
        return userProfileRepository.findDisplayInfoByUserId(requesterMemberId.intValue())
                .map(info -> StringUtils.hasText(info.getFullName())
                        ? info.getFullName().trim()
                        : "Người dùng " + requesterMemberId)
                .defaultIfEmpty("Người dùng " + requesterMemberId)
                .doOnNext(requesterName -> {
                    String title = "Lời mời kết nối mới";
                    String messageText = requesterName + " đã gửi cho bạn một lời mời kết nối.";
                    String link = "/network/requests";
                    notificationService.createNotificationAsync(targetMemberId.intValue(), title, messageText, link);
                    sseService.sendToUser(targetMemberId, "connection-request", Map.of(
                            "title", title,
                            "message", messageText,
                            "link", link,
                            "requesterMemberId", requesterMemberId));
                })
                .then()
                .onErrorResume(error -> {
                    log.warn("Failed to notify target {} of incoming connection request from {}",
                            targetMemberId, requesterMemberId, error);
                    return Mono.empty();
                });
    }

    /**
     * Handles the case where a conversation request already exists between the two members.
     *
     * <ul>
     *   <li>PENDING, current sender is the original requester → reject: their own request is
     *       still awaiting a response.</li>
     *   <li>PENDING, current sender is the original target → auto-accept: the other member already
     *       invited them, so sending back is mutual intent and connects the pair immediately
     *       (same effect as accepting the request).</li>
     *   <li>ACCEPTED → reject: the two members are already connected.</li>
     *   <li>REJECTED + cooldown still active → reject: too early to retry.</li>
     *   <li>REJECTED + cooldown expired → allow re-request: insert a new message into the
     *       existing chat group and update the request record.
     *       {@code requester_member_id} and {@code target_member_id} are refreshed to reflect
     *       the current sender/receiver, because the direction may have reversed (e.g., the
     *       original target now initiates). See docs/CONVERSATION_REQUEST_DESIGN.md for rationale.
     *   </li>
     * </ul>
     */
    private Mono<Long> handleExistingRequest(
            ChatConversationRequest existing,
            Long currentMemberId,
            Long targetMemberId,
            String message) {

        ConversationRequestStatus status = existing.getStatus();

        if (status == ConversationRequestStatus.PENDING) {
            // The current sender already owns the pending outgoing request → still just pending.
            if (existing.getRequesterMemberId().equals(currentMemberId)) {
                return Mono.error(new ApplicationException(
                        ErrorCode.CONVERSATION_REQUEST_ALREADY_PENDING,
                        "A conversation request is already pending between these two members"));
            }
            // The other member invited the current sender first; sending back is mutual intent,
            // so connect the pair right away instead of stacking a second pending request.
            return autoAcceptMutualRequest(existing, currentMemberId, message);
        }

        if (status == ConversationRequestStatus.ACCEPTED) {
            return Mono.error(new ApplicationException(
                    ErrorCode.CONVERSATION_REQUEST_ALREADY_ACCEPTED,
                    "These two members are already connected"));
        }

        if (status == ConversationRequestStatus.REJECTED) {
            LocalDateTime cooldownUntil = existing.getCooldownUntil();
            boolean cooldownStillActive = cooldownUntil != null && LocalDateTime.now().isBefore(cooldownUntil);
            if (cooldownStillActive) {
                return Mono.error(new ApplicationException(
                        ErrorCode.CONVERSATION_REQUEST_COOLDOWN_ACTIVE,
                        "Conversation request cooldown is still active until " + cooldownUntil));
            }

            return insertInitialMessage(existing.getChatGroupId(), currentMemberId, message)
                    .flatMap(savedMessage -> {
                        existing.setRequesterMemberId(currentMemberId);
                        existing.setTargetMemberId(targetMemberId);
                        existing.setLastRequestMessageId(savedMessage.getId());
                        existing.setStatus(ConversationRequestStatus.PENDING);
                        existing.setCooldownUntil(null);
                        return chatConversationRequestRepository.save(existing);
                    })
                    .flatMap(updated -> {
                        log.info("Conversation request re-sent: id={}, requester={}, target={}",
                                updated.getId(), currentMemberId, targetMemberId);
                        // A re-send is a fresh request → notify the recipient like a brand-new one.
                        return notifyTargetOfIncomingRequest(currentMemberId, targetMemberId)
                                .thenReturn(updated.getId());
                    });
        }

        return Mono.error(new ApplicationException(
                ErrorCode.BAD_REQUEST,
                "Unexpected conversation request status: " + status));
    }

    /**
     * Accepts a still-pending request on behalf of its target because that target is now the one
     * sending back — mutual intent. Inserts the sender's message into the existing group, flips the
     * request to ACCEPTED and adds both members to the group, mirroring the normal accept flow (and
     * like that flow, it does not notify the original requester of a "new request"). Returns the
     * request id.
     */
    private Mono<Long> autoAcceptMutualRequest(
            ChatConversationRequest existing,
            Long currentMemberId,
            String message) {

        return insertInitialMessage(existing.getChatGroupId(), currentMemberId, message)
                .flatMap(savedMessage -> {
                    existing.setStatus(ConversationRequestStatus.ACCEPTED);
                    existing.setCooldownUntil(null);
                    existing.setUpdatedAt(LocalDateTime.now());
                    return chatConversationRequestRepository.save(existing);
                })
                .flatMap(saved -> chatGroupRepository.findById(saved.getChatGroupId())
                        .switchIfEmpty(Mono.error(new ApplicationException(
                                ErrorCode.RESOURCES_NOT_FOUND,
                                "Chat group not found for conversation request: " + saved.getChatGroupId())))
                        .flatMap(group -> addBothMembersToGroup(
                                group, saved.getRequesterMemberId(), saved.getTargetMemberId())
                                .thenReturn(saved.getId())))
                .doOnSuccess(id -> log.info(
                        "Conversation auto-connected via mutual request: id={}, requester={}, acceptingSender={}",
                        id, existing.getRequesterMemberId(), currentMemberId));
    }

    private Mono<ChatGroup> createPrivateChatGroup(Long createdByMemberId) {
        ChatGroup newGroup = ChatGroup.builder()
                .type(ChatType.PRIVATE)
                .title(null)
                .createdBy(createdByMemberId)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        return chatGroupRepository.save(newGroup);
    }

    private Mono<Void> addBothMembersToGroup(ChatGroup group, Long currentMemberId, Long targetMemberId) {
        LocalDateTime now = LocalDateTime.now();
        ChatGroupMember currentMember = ChatGroupMember.builder()
                .groupId(group.getId())
                .memberId(currentMemberId)
                .role(ChatRole.MEMBER)
                .joinedAt(now)
                .build();
        ChatGroupMember targetMember = ChatGroupMember.builder()
                .groupId(group.getId())
                .memberId(targetMemberId)
                .role(ChatRole.MEMBER)
                .joinedAt(now)
                .build();
        return chatGroupMemberRepository.saveAll(Flux.just(currentMember, targetMember)).then();
    }

    private Mono<ChatMessage> insertInitialMessage(Long groupId, Long senderMemberId, String content) {
        return chatMessageRepository.insertMessage(
                groupId,
                senderMemberId,
                content,
                "TEXT",
                null,
                LocalDateTime.now());
    }

    private Mono<ChatConversationRequest> saveConversationRequest(
            long memberLowId,
            long memberHighId,
            Long requesterMemberId,
            Long targetMemberId,
            Long chatGroupId,
            Long messageId,
            ConversationRequestStatus status) {

        ChatConversationRequest request = ChatConversationRequest.builder()
                .memberLowId(memberLowId)
                .memberHighId(memberHighId)
                .requesterMemberId(requesterMemberId)
                .targetMemberId(targetMemberId)
                .chatGroupId(chatGroupId)
                .lastRequestMessageId(messageId)
                .cooldownUntil(null)
                .status(status)
                .build();
        return chatConversationRequestRepository.save(request);
    }

    /**
     * Grants a member pair an ACCEPTED conversation immediately, skipping the normal
     * request/respond handshake. Used when another flow (e.g. peer verification) already
     * establishes the relationship and messaging access should follow without an extra
     * accept step. Silently no-ops when the pair is blocked or still under an active
     * rejection cooldown, mirroring how those cases are treated as "not connectable" elsewhere.
     */
    public Mono<Void> autoAcceptConversationRequest(
            Long requesterMemberId,
            Long targetMemberId,
            String message) {

        if (requesterMemberId.equals(targetMemberId)) {
            return Mono.empty();
        }

        long memberLowId = Math.min(requesterMemberId, targetMemberId);
        long memberHighId = Math.max(requesterMemberId, targetMemberId);

        return userBlockService.assertCommunicationNotBlocked(requesterMemberId, targetMemberId)
                // Mutation in its own transaction so the concurrent-conflict retry can run outside
                // it (a failed insert aborts the transaction and blocks any in-tx re-query).
                .then(Mono.defer(() -> autoAcceptConversationRequestAfterBlockCheck(
                        memberLowId, memberHighId, requesterMemberId, targetMemberId, message)
                        .as(transactionalOperator::transactional)))
                .onErrorResume(DataIntegrityViolationException.class, error ->
                        autoAcceptConversationRequestAfterBlockCheck(
                                memberLowId, memberHighId, requesterMemberId, targetMemberId, message)
                                .as(transactionalOperator::transactional))
                .onErrorResume(ApplicationException.class, error -> {
                    if (error.getErrorCode() == ErrorCode.USER_COMMUNICATION_BLOCKED) {
                        log.info("Skipping auto-accept conversation: communication blocked between {} and {}",
                                requesterMemberId, targetMemberId);
                        return Mono.empty();
                    }
                    return Mono.error(error);
                });
    }

    private Mono<Void> autoAcceptConversationRequestAfterBlockCheck(
            long memberLowId,
            long memberHighId,
            Long requesterMemberId,
            Long targetMemberId,
            String message) {

        // On a concurrent insert conflict the transaction is aborted; the error propagates to
        // autoAcceptConversationRequest, which retries in a fresh transaction where the pair is
        // now found and auto-accepted via autoAcceptExistingRequest.
        return chatConversationRequestRepository.findByMemberPair(memberLowId, memberHighId)
                .flatMap(this::autoAcceptExistingRequest)
                .switchIfEmpty(createAutoAcceptedConversation(
                        memberLowId, memberHighId, requesterMemberId, targetMemberId, message));
    }

    private Mono<Void> autoAcceptExistingRequest(ChatConversationRequest existing) {
        ConversationRequestStatus status = existing.getStatus();

        if (status == ConversationRequestStatus.ACCEPTED) {
            return Mono.empty();
        }

        if (status == ConversationRequestStatus.REJECTED) {
            LocalDateTime cooldownUntil = existing.getCooldownUntil();
            boolean cooldownStillActive = cooldownUntil != null && LocalDateTime.now().isBefore(cooldownUntil);
            if (cooldownStillActive) {
                return Mono.empty();
            }
        }

        existing.setStatus(ConversationRequestStatus.ACCEPTED);
        existing.setCooldownUntil(null);
        existing.setUpdatedAt(LocalDateTime.now());

        return chatConversationRequestRepository.save(existing)
                .flatMap(saved -> chatGroupRepository.findById(saved.getChatGroupId())
                        .switchIfEmpty(Mono.error(new ApplicationException(
                                ErrorCode.RESOURCES_NOT_FOUND,
                                "Chat group not found for conversation request: " + saved.getChatGroupId())))
                        .flatMap(group -> addBothMembersToGroup(group, saved.getRequesterMemberId(), saved.getTargetMemberId())))
                .doOnSuccess(ignored -> log.info("Conversation auto-accepted: id={}", existing.getId()));
    }

    private Mono<Void> createAutoAcceptedConversation(
            long memberLowId,
            long memberHighId,
            Long requesterMemberId,
            Long targetMemberId,
            String message) {

        return createPrivateChatGroup(requesterMemberId)
                .flatMap(savedGroup -> insertInitialMessage(savedGroup.getId(), requesterMemberId, message)
                        .flatMap(savedMessage -> saveConversationRequest(
                                memberLowId, memberHighId, requesterMemberId, targetMemberId,
                                savedGroup.getId(), savedMessage.getId(), ConversationRequestStatus.ACCEPTED)
                                .flatMap(savedRequest -> addBothMembersToGroup(savedGroup, requesterMemberId, targetMemberId)
                                        .doOnSuccess(ignored -> log.info(
                                                "Conversation auto-created and accepted: id={}, requester={}, target={}",
                                                savedRequest.getId(), requesterMemberId, targetMemberId)))));
    }

    public Mono<PaginatedResponse<ConversationRequestSearchItemResponse>> searchIncomingRequests(
            Long currentUserId,
            String fullName,
            String status,
            int page,
            int size) {

        String fullNamePattern = toFullNameContainsPattern(fullName);
        String statusFilter = StringUtils.hasText(status) ? status.trim().toUpperCase() : null;
        int offset = page * size;

        if (ConversationRequestStatus.ACCEPTED.name().equals(statusFilter)) {
            return Mono.error(new ApplicationException(
                    ErrorCode.CONVERSATION_REQUEST_SEARCH_STATUS_NOT_ALLOWED,
                    "Searching by ACCEPTED status is not allowed; use /api/chat/connections/search instead"));
        }

        log.info("Searching incoming conversation requests userId={} fullName={} status={} page={} size={}",
                currentUserId, fullNamePattern != null, statusFilter, page, size);

        Mono<Long> totalMono = chatConversationRequestRepository.countIncomingRequests(
                currentUserId, fullNamePattern, statusFilter);

        return PaginationHelper.paginate(
                chatConversationRequestRepository.searchIncomingRequests(currentUserId, fullNamePattern, statusFilter, size, offset),
                totalMono,
                page,
                size);
    }

    private static String toFullNameContainsPattern(String raw) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        return "%" + raw.trim() + "%";
    }
}
    
