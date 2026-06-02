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

import com.service.backend.shared.entity.ChatConversationRequest;
import com.service.backend.shared.entity.ChatGroup;
import com.service.backend.shared.entity.ChatGroupMember;
import com.service.backend.shared.entity.ChatMessage;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.enums.ConversationRequestStatus;


import com.service.backend.shared.enums.ChatType;
import com.service.backend.shared.enums.ChatRole;
import com.service.backend.shared.enums.Status;
import com.service.backend.shared.exception.ApplicationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatConversationRequestService {

    private final ChatConversationRequestRepository chatConversationRequestRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatGroupRepository chatGroupRepository;
    private final ChatGroupMemberRepository chatGroupMemberRepository;

    /**
     * Returns connection status and the current member's latest message in the request chat group.
     * Empty when no conversation request exists for the pair.
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

        return chatConversationRequestRepository
                .findByMemberPair(memberLowId, memberHighId)
                .flatMap(request -> buildConnectionStatusResponse(request, currentMemberId));
    }

    private Mono<ConversationRequestConnectionStatusResponse> buildConnectionStatusResponse(
            ChatConversationRequest request,
            Long currentMemberId) {
        return chatMessageRepository
                .findLatestByGroupIdAndSenderMemberId(request.getChatGroupId(), currentMemberId)
                .map(message -> toConnectionStatusResponse(request, message))
                .defaultIfEmpty(toConnectionStatusResponse(request, null));
    }

    private ConversationRequestConnectionStatusResponse toConnectionStatusResponse(
            ChatConversationRequest request,
            ChatMessage message) {
        return new ConversationRequestConnectionStatusResponse(
                request.getStatus(),
                request.getCooldownUntil(),
                message != null ? toLatestMessageResponse(message) : null);
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
     */
    @Transactional
    public Mono<Long> createConversationRequest(
            Long currentMemberId,
            Long targetMemberId,
            String message) {

        if (currentMemberId.equals(targetMemberId)) {
            return Mono.error(new ApplicationException(
                    ErrorCode.BAD_REQUEST,
                    "Cannot send a conversation request to yourself"));
        }

        long memberLowId = Math.min(currentMemberId, targetMemberId);
        long memberHighId = Math.max(currentMemberId, targetMemberId);

        return chatConversationRequestRepository.findByMemberPair(memberLowId, memberHighId)
                .flatMap(existing -> handleExistingRequest(existing, currentMemberId, targetMemberId, message))
                .switchIfEmpty(
                        createPrivateChatGroup(currentMemberId)
                                .flatMap(savedGroup -> insertInitialMessage(savedGroup.getId(), currentMemberId, message)
                                        .flatMap(savedMessage -> saveConversationRequest(
                                                memberLowId, memberHighId, currentMemberId, targetMemberId,
                                                savedGroup.getId(), savedMessage.getId()))
                                        .map(savedRequest -> {
                                            log.info("Conversation request created: id={}, requester={}, target={}",
                                                    savedRequest.getId(), currentMemberId, targetMemberId);
                                            return savedRequest.getId();
                                        })));
    }

    /**
     * Handles the case where a conversation request already exists between the two members.
     *
     * <ul>
     *   <li>PENDING  → reject: the previous request has not been answered yet.</li>
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
            return Mono.error(new ApplicationException(
                    ErrorCode.CONVERSATION_REQUEST_ALREADY_PENDING,
                    "A conversation request is already pending between these two members"));
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
                    .map(updated -> {
                        log.info("Conversation request re-sent: id={}, requester={}, target={}",
                                updated.getId(), currentMemberId, targetMemberId);
                        return updated.getId();
                    });
        }

        return Mono.error(new ApplicationException(
                ErrorCode.BAD_REQUEST,
                "Unexpected conversation request status: " + status));
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
            Long messageId) {

        ChatConversationRequest request = ChatConversationRequest.builder()
                .memberLowId(memberLowId)
                .memberHighId(memberHighId)
                .requesterMemberId(requesterMemberId)
                .targetMemberId(targetMemberId)
                .chatGroupId(chatGroupId)
                .lastRequestMessageId(messageId)
                .cooldownUntil(null)
                .status(ConversationRequestStatus.PENDING)
                .build();
        return chatConversationRequestRepository.save(request);
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

        log.info("Searching incoming conversation requests userId={} fullName={} status={} page={} size={}",
                currentUserId, fullNamePattern != null, statusFilter, page, size);

        Mono<Long> totalMono = chatConversationRequestRepository.countIncomingRequests(
                currentUserId, fullNamePattern, statusFilter);

        return chatConversationRequestRepository
                .searchIncomingRequests(currentUserId, fullNamePattern, statusFilter, size, offset)
                .collectList()
                .zipWith(totalMono)
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, size));
    }

    private static String toFullNameContainsPattern(String raw) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        return "%" + raw.trim() + "%";
    }
}
    
