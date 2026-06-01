package com.service.backend.chat.service;

import com.service.backend.chat.dao.ChatConversationRequestRepository;
import com.service.backend.chat.dao.ChatGroupMemberRepository;
import com.service.backend.chat.dao.ChatGroupRepository;
import com.service.backend.chat.dao.ChatMessageRepository;
import com.service.backend.chat.dto.ConversationRequestConnectionStatusResponse;
import com.service.backend.chat.dto.ConversationRequestLatestMessageResponse;
import com.service.backend.shared.entity.ChatConversationRequest;
import com.service.backend.shared.entity.ChatGroup;
import com.service.backend.shared.entity.ChatGroupMember;
import com.service.backend.shared.entity.ChatMessage;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.enums.ChatType;
import com.service.backend.shared.enums.ChatRole;
import com.service.backend.shared.enums.Status;
import com.service.backend.shared.exception.ApplicationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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
     * Creates a new conversation request between the current member and a target member.
     * Allocates a dedicated private chat group, inserts the initial message, and records
     * the request with a 7-day cooldown window starting from message creation time.
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
                .flatMap(existing -> Mono.<Long>error(new ApplicationException(
                        ErrorCode.RESOURCES_DUPLICATE,
                        "A conversation request already exists between these two members")))
                .switchIfEmpty(
                        createPrivateChatGroup(currentMemberId)
                                .flatMap(savedGroup -> addBothMembersToGroup(savedGroup, currentMemberId, targetMemberId)
                                        .then(insertInitialMessage(savedGroup.getId(), currentMemberId, message))
                                        .flatMap(savedMessage -> saveConversationRequest(
                                                memberLowId, memberHighId, currentMemberId,
                                                savedGroup.getId(), savedMessage.getCreatedAt()))
                                        .map(savedRequest -> {
                                            log.info("Conversation request created: id={}, requester={}, target={}",
                                                    savedRequest.getId(), currentMemberId, targetMemberId);
                                            return savedRequest.getId();
                                        })));
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
            Long chatGroupId,
            LocalDateTime messageCreatedAt) {

        ChatConversationRequest request = ChatConversationRequest.builder()
                .memberLowId(memberLowId)
                .memberHighId(memberHighId)
                .requesterMemberId(requesterMemberId)
                .chatGroupId(chatGroupId)
                .lastRequestMessageAt(messageCreatedAt)
                .cooldownUntil(messageCreatedAt.plusDays(7))
                .status(Status.PENDING)
                .build();
        return chatConversationRequestRepository.save(request);
    }
}
    
