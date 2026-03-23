package com.service.backend.chat.service;

import com.service.backend.chat.entity.ChatGroup;
import com.service.backend.chat.entity.ChatGroupMember;
import com.service.backend.chat.entity.ChatMessage;
import com.service.backend.chat.dao.ChatGroupMemberRepository;
import com.service.backend.chat.dao.ChatGroupRepository;
import com.service.backend.chat.dao.ChatMessageRepository;
import com.service.backend.shared.constants.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ChatService {

    private final ChatGroupRepository chatGroupRepository;
    private final ChatGroupMemberRepository chatGroupMemberRepository;
    private final ChatMessageRepository chatMessageRepository;

    public ChatService(
        ChatGroupRepository cGRepo,
        ChatGroupMemberRepository cGMRepo,
        ChatMessageRepository cMRepo
    ) {
        this.chatGroupMemberRepository = cGMRepo;
        this.chatGroupRepository = cGRepo;
        this.chatMessageRepository = cMRepo;
    }


    public Mono<ChatGroup> getOrCreatePrivateChat(Long memberAId, Long memberBId) {
        if (memberAId == null || memberBId == null) {
            return Mono.error(new ApplicationException(ErrorCode.USER_NOT_FOUND, "Member IDs must not be null"));
        }

        if (memberAId.equals(memberBId)) {
            return Mono.error(new ApplicationException(ErrorCode.USER_NOT_FOUND, "Cannot create private chat with yourself"));
        }

        return chatGroupRepository.findPrivateChatBetweenMembers(memberAId, memberBId)
                .switchIfEmpty(createPrivateChat(memberAId, memberBId));
    }

    private Mono<ChatGroup> createPrivateChat(Long memberAId, Long memberBId) {
        ChatGroup newGroup = ChatGroup.builder()
                .type("PRIVATE")
                .title(null)
                .createdBy(memberAId)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        return chatGroupRepository.save(newGroup)
                .flatMap(savedGroup -> {
                    ChatGroupMember memberA = ChatGroupMember.builder()
                            .groupId(savedGroup.getId())
                            .memberId(memberAId)
                            .role("member")
                            .joinedAt(LocalDateTime.now())
                            .build();

                    ChatGroupMember memberB = ChatGroupMember.builder()
                            .groupId(savedGroup.getId())
                            .memberId(memberBId)
                            .role("member")
                            .joinedAt(LocalDateTime.now())
                            .build();

                    return chatGroupMemberRepository.saveAll(Flux.just(memberA, memberB))
                            .then(Mono.just(savedGroup));
                });
    }


    public Mono<ChatMessage> sendMessage(Long groupId,
                                         Long senderMemberId,
                                         String content,
                                         String messageType,
                                         String metadata) {
        if (groupId == null || senderMemberId == null) {
            return Mono.error(new ApplicationException(ErrorCode.USER_NOT_FOUND, "Group ID and sender ID must not be null"));
        }

        return chatGroupMemberRepository.findByGroupId(groupId)
                .filter(member -> senderMemberId.equals(member.getMemberId()))
                .hasElements()
                .flatMap(isMember -> {
                    if (!isMember) {
                        return Mono.error(new ApplicationException(ErrorCode.USER_NOT_FOUND, "Sender is not a member of this chat group"));
                    }

                    ChatMessage message = ChatMessage.builder()
                            .groupId(groupId)
                            .senderMemberId(senderMemberId)
                            .content(content)
                            .messageType(messageType != null ? messageType : "TEXT")
                            .metadata(metadata)
                            .createdAt(LocalDateTime.now())
                            .build();

                    return chatMessageRepository.save(message);
                });
    }


    public Flux<ChatMessage> getMessages(Long groupId, int page, int size) {
        int limit = Math.max(size, 1);
        int offset = Math.max(page, 0) * limit;
        return chatMessageRepository.findByGroupIdWithPagination(groupId, limit, offset);
    }


    public Mono<Long> countMessages(Long groupId) {
        return chatMessageRepository.countByGroupId(groupId);
    }

    /**
     * Create a GROUP chat.
     * - type = 'GROUP'
     * - createdBy = creatorMemberId
     * - creator is added as 'owner'
     * - other members are added as 'member'
     * NOTE: If memberIds.size() == 2, caller should use private chat API instead.
     */
    public Mono<ChatGroup> createGroupChat(Long creatorMemberId, List<Long> memberIds) {
        if (creatorMemberId == null) {
            return Mono.error(new ApplicationException(ErrorCode.USER_NOT_FOUND, "Creator member ID must not be null"));
        }

        if (memberIds == null || memberIds.isEmpty()) {
            return Mono.error(new ApplicationException(ErrorCode.RESOURCES_NOT_FOUND, "Member IDs must not be empty"));
        }

        if (memberIds.size() == 2) {
            return Mono.error(new ApplicationException(ErrorCode.RESOURCES_DUPLICATE, "Use private chat API for 1-1 conversations"));
        }

        LocalDateTime now = LocalDateTime.now();

        ChatGroup group = ChatGroup.builder()
                .type("GROUP")
                .title(null)
                .createdBy(creatorMemberId)
                .createdAt(now)
                .updatedAt(now)
                .build();

        return chatGroupRepository.save(group)
                .flatMap(savedGroup -> {
                    ChatGroupMember owner = ChatGroupMember.builder()
                            .groupId(savedGroup.getId())
                            .memberId(creatorMemberId)
                            .role("owner")
                            .joinedAt(now)
                            .build();

                    List<ChatGroupMember> others = memberIds.stream()
                            .filter(id -> !creatorMemberId.equals(id))
                            .distinct()
                            .map(id -> ChatGroupMember.builder()
                                    .groupId(savedGroup.getId())
                                    .memberId(id)
                                    .role("member")
                                    .joinedAt(now)
                                    .build())
                            .toList();

                    return chatGroupMemberRepository.saveAll(Flux.fromIterable(others).startWith(owner))
                            .then(Mono.just(savedGroup));
                });
    }

    /**
     * Add members to a GROUP chat.
     * Only the owner (createdBy) can add members.
     */
    public Mono<Void> addMembersToGroup(Long groupId, Long requesterId, List<Long> memberIds) {
        if (groupId == null || requesterId == null) {
            return Mono.error(new ApplicationException(ErrorCode.RESOURCES_NOT_FOUND, "Group ID and requester ID must not be null"));
        }

        if (memberIds == null || memberIds.isEmpty()) {
            return Mono.empty();
        }

        return chatGroupRepository.findById(groupId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.RESOURCES_NOT_FOUND, "Chat group not found")))
                .flatMap(group -> {
                    if (!requesterId.equals(group.getCreatedBy())) {
                        return Mono.error(new ApplicationException(ErrorCode.FORBIDDEN, "Only group owner can add members"));
                    }

                    LocalDateTime now = LocalDateTime.now();

                    return chatGroupMemberRepository.findByGroupId(groupId)
                            .map(ChatGroupMember::getMemberId)
                            .collectList()
                            .flatMap(existingMembers -> {
                                List<ChatGroupMember> newMembers = memberIds.stream()
                                        .filter(id -> !existingMembers.contains(id))
                                        .distinct()
                                        .map(id -> ChatGroupMember.builder()
                                                .groupId(groupId)
                                                .memberId(id)
                                                .role("member")
                                                .joinedAt(now)
                                                .build())
                                        .toList();

                                if (newMembers.isEmpty()) {
                                    return Mono.empty();
                                }

                                return chatGroupMemberRepository.saveAll(Flux.fromIterable(newMembers))
                                        .then();
                            });
                });
    }

    /**
     * Remove a member from a GROUP chat.
     * Only the owner (createdBy) can remove other members.
     * Owner cannot remove themselves using this method (use leaveGroup instead).
     */
    public Mono<Void> removeMemberFromGroup(Long groupId, Long requesterId, Long memberId) {
        if (groupId == null || requesterId == null || memberId == null) {
            return Mono.error(new ApplicationException(ErrorCode.RESOURCES_NOT_FOUND, "Group ID, requester ID and member ID must not be null"));
        }

        return chatGroupRepository.findById(groupId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.RESOURCES_NOT_FOUND, "Chat group not found")))
                .flatMap(group -> {
                    if (!requesterId.equals(group.getCreatedBy())) {
                        return Mono.error(new ApplicationException(ErrorCode.FORBIDDEN, "Only group owner can remove members"));
                    }
                    if (memberId.equals(group.getCreatedBy())) {
                        return Mono.error(new ApplicationException(ErrorCode.FORBIDDEN, "Owner cannot be removed using this operation"));
                    }

                    return chatGroupMemberRepository.deleteByGroupIdAndMemberId(groupId, memberId);
                });
    }

    /**
     * Get members of a group.
     */
    public Flux<ChatGroupMember> getGroupMembers(Long groupId) {
        return chatGroupMemberRepository.findByGroupId(groupId);
    }

    /**
     * Update basic group info (e.g. title).
     * Only owner (createdBy) can update.
     */
    public Mono<ChatGroup> updateGroupInfo(Long groupId, Long requesterId, String title) {
        if (groupId == null || requesterId == null) {
            return Mono.error(new ApplicationException(ErrorCode.RESOURCES_NOT_FOUND, "Group ID and requester ID must not be null"));
        }

        return chatGroupRepository.findById(groupId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.RESOURCES_NOT_FOUND, "Chat group not found")))
                .flatMap(group -> {
                    if (!requesterId.equals(group.getCreatedBy())) {
                        return Mono.error(new ApplicationException(ErrorCode.FORBIDDEN, "Only group owner can update group info"));
                    }

                    group.setTitle(title);
                    group.setUpdatedAt(LocalDateTime.now());
                    return chatGroupRepository.save(group);
                });
    }

    /**
     * Member leaves a group.
     * - If normal member: simply remove membership.
     * - If owner:
     *   - If there are other members: transfer ownership to earliest joined non-owner.
     *   - If no other members: delete group and all messages.
     */
    public Mono<Void> leaveGroup(Long groupId, Long memberId) {
        if (groupId == null || memberId == null) {
            return Mono.error(new ApplicationException(ErrorCode.RESOURCES_NOT_FOUND, "Group ID and member ID must not be null"));
        }

        return chatGroupRepository.findById(groupId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.RESOURCES_NOT_FOUND, "Chat group not found")))
                .flatMap(group ->
                        chatGroupMemberRepository.findByGroupIdAndMemberId(groupId, memberId)
                                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.RESOURCES_NOT_FOUND, "Member is not part of this group")))
                                .flatMap(currentMember -> {
                                    boolean isOwner = memberId.equals(group.getCreatedBy());

                                    if (!isOwner) {
                                        return chatGroupMemberRepository.deleteByGroupIdAndMemberId(groupId, memberId);
                                    }

                                    return chatGroupMemberRepository.findByGroupId(groupId)
                                            .filter(m -> !m.getMemberId().equals(memberId))
                                            .sort((m1, m2) -> m1.getJoinedAt().compareTo(m2.getJoinedAt()))
                                            .collectList()
                                            .flatMap(others -> {
                                                if (others.isEmpty()) {
                                                    // No other members: delete group and messages
                                                    return chatMessageRepository.deleteByGroupId(groupId)
                                                            .then(chatGroupMemberRepository.deleteByGroupId(groupId))
                                                            .then(chatGroupRepository.delete(group));
                                                }

                                                ChatGroupMember newOwnerMember = others.get(0);
                                                group.setCreatedBy(newOwnerMember.getMemberId());
                                                group.setUpdatedAt(LocalDateTime.now());

                                                return chatGroupRepository.save(group)
                                                        .then(chatGroupMemberRepository.deleteByGroupIdAndMemberId(groupId, memberId));
                                            });
                                })
                );
    }

    /**
     * Delete a group entirely (owner only).
     */
    public Mono<Void> deleteGroup(Long groupId, Long requesterId) {
        if (groupId == null || requesterId == null) {
            return Mono.error(new ApplicationException(ErrorCode.RESOURCES_NOT_FOUND, "Group ID and requester ID must not be null"));
        }

        return chatGroupRepository.findById(groupId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.RESOURCES_NOT_FOUND, "Chat group not found")))
                .flatMap(group -> {
                    if (!requesterId.equals(group.getCreatedBy())) {
                        return Mono.error(new ApplicationException(ErrorCode.FORBIDDEN, "Only group owner can delete group"));
                    }

                    return chatMessageRepository.deleteByGroupId(groupId)
                            .then(chatGroupMemberRepository.deleteByGroupId(groupId))
                            .then(chatGroupRepository.delete(group));
                });
    }
}

