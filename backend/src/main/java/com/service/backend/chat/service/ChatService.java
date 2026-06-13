package com.service.backend.chat.service;

import org.springframework.transaction.annotation.Transactional;
import com.service.backend.auth.dao.AuthRepository;
import com.service.backend.chat.dao.ChatGroupMemberRepository;
import com.service.backend.chat.dao.ChatGroupRepository;
import com.service.backend.chat.dao.ChatMessageRepository;
import com.service.backend.chat.dto.BlockPairFlags;
import com.service.backend.chat.dto.ChatGroupMemberItemResponse;
import com.service.backend.chat.dto.ChatGroupMetadataResponse;
import com.service.backend.chat.dto.ChatMessageResponse;
import com.service.backend.chat.dto.GroupBlockedMembersContextResponse;
import com.service.backend.chat.dto.GroupChatListItemResponse;
import com.service.backend.chat.dto.PrivateChatListItemResponse;
import com.service.backend.shared.entity.ChatGroup;
import com.service.backend.shared.entity.ChatGroupMember;
import com.service.backend.shared.entity.ChatMessage;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.enums.ChatRole;
import com.service.backend.shared.enums.ChatType;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.utils.PaginationHelper;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
public class ChatService {

    private static final int MAX_GROUP_SIZE = 10;

    private final ChatGroupRepository chatGroupRepository;
    private final ChatGroupMemberRepository chatGroupMemberRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final AuthRepository authRepository;
    private final UserBlockService userBlockService;

    public ChatService(
        ChatGroupRepository cGRepo,
        ChatGroupMemberRepository cGMRepo,
        ChatMessageRepository cMRepo,
        AuthRepository authRepository,
        UserBlockService userBlockService
    ) {
        this.chatGroupMemberRepository = cGMRepo;
        this.chatGroupRepository = cGRepo;
        this.chatMessageRepository = cMRepo;
        this.authRepository = authRepository;
        this.userBlockService = userBlockService;
    }


    public Mono<ChatGroup> getOrCreatePrivateChat(Long memberAId, Long memberBId) {
        if (memberAId == null || memberBId == null) {
            return Mono.error(new ApplicationException(ErrorCode.USER_NOT_FOUND, "Member IDs must not be null"));
        }

        if (memberAId.equals(memberBId)) {
            return Mono.error(new ApplicationException(ErrorCode.USER_NOT_FOUND, "Cannot create private chat with yourself"));
        }

        return chatGroupRepository.findPrivateChatBetweenMembers(memberAId, memberBId)
                .switchIfEmpty(createNewPrivateChat(memberAId, memberBId));
    }

    public Mono<ChatGroup> getPrivateChat(Long memberAId, Long memberBId) {
        if (memberAId == null || memberBId == null) {
            return Mono.error(new ApplicationException(ErrorCode.USER_NOT_FOUND, "Member IDs must not be null"));
        }

        if (memberAId.equals(memberBId)) {
            return Mono.error(new ApplicationException(ErrorCode.USER_NOT_FOUND, "Cannot get private chat with yourself"));
        }

        return chatGroupRepository.findPrivateChatBetweenMembers(memberAId, memberBId);
    }

    public Mono<ChatGroup> createNewPrivateChat(Long memberAId, Long memberBId) {
        if (memberAId == null || memberBId == null) {
            return Mono.error(new ApplicationException(ErrorCode.USER_NOT_FOUND, "Member IDs must not be null"));
        }

        if (memberAId.equals(memberBId)) {
            return Mono.error(new ApplicationException(ErrorCode.USER_NOT_FOUND, "Cannot create private chat with yourself"));
        }

        return createPrivateChat(memberAId, memberBId);
    }

    public Mono<List<ChatGroup>> getListChatGroupsByType(Long memberId, String type) {
        if (memberId == null) {
            return Mono.error(new ApplicationException(ErrorCode.USER_NOT_FOUND, "Member ID must not be null"));
        }

        return chatGroupMemberRepository.findByMemberId(memberId)
                .map(ChatGroupMember::getGroupId)
                .distinct()
                .flatMap(chatGroupRepository::findById)
                .filter(group -> type == null || (group.getType() != null && type.equalsIgnoreCase(group.getType().getValue())))
                .collectList();
    }

    public Mono<PaginatedResponse<PrivateChatListItemResponse>> getListPrivateChatsWithSummary(
            Long memberId, String text, int page, int size) {
        if (memberId == null) {
            return Mono.error(new ApplicationException(ErrorCode.USER_NOT_FOUND, "Member ID must not be null"));
        }

        return getListChatGroupsByType(memberId, ChatType.PRIVATE.getValue())
                .flatMapMany(Flux::fromIterable)
                .concatMap(group -> buildPrivateChatListItem(group, memberId))
                .collectList()
                .flatMap(list -> {
                    list.sort(Comparator.comparing(
                            (PrivateChatListItemResponse item) ->
                                    item.getLastMessageAt() != null ? item.getLastMessageAt() : item.getUpdatedAt()
                    ).reversed());

                    List<PrivateChatListItemResponse> filtered = (text == null || text.isBlank())
                            ? list
                            : list.stream()
                                  .filter(item -> item.getPeerUserName() != null &&
                                                  item.getPeerUserName().toLowerCase().contains(text.toLowerCase()))
                                  .toList();

                    return PaginationHelper.paginateList(filtered, page, size);
                });
    }

    private Mono<PrivateChatListItemResponse> buildPrivateChatListItem(ChatGroup group, Long currentMemberId) {
        return chatGroupMemberRepository.findByGroupId(group.getId())
                .map(ChatGroupMember::getMemberId)
                .collectList()
                .flatMap(memberIds -> {
                    Long peerId = memberIds.stream()
                            .filter(id -> !id.equals(currentMemberId))
                            .findFirst()
                            .orElse(null);

                    if (peerId == null) {
                        return Mono.just(buildPrivateChatListItemResponse(
                                group,
                                null,
                                "Unknown",
                                null,
                                null,
                                null,
                                false,
                                false
                        ));
                    }

                    Long finalPeerId = peerId;

                    record PeerInfo(String userName, String avatarUrl) {}

                    Mono<PeerInfo> peerInfoMono = authRepository.findById(finalPeerId.intValue())
                            .map(user -> new PeerInfo(user.getUserName(), user.getAvatarUrl()))
                            .switchIfEmpty(Mono.just(new PeerInfo("User " + finalPeerId, null)));

                    Mono<BlockPairFlags> blockFlagsMono =
                            userBlockService.getBlockFlagsBetween(currentMemberId, finalPeerId);

                    return Mono.zip(peerInfoMono, blockFlagsMono)
                            .flatMap(tuple -> {
                                PeerInfo peerInfo = tuple.getT1();
                                BlockPairFlags flags = tuple.getT2();

                                return chatMessageRepository.findLastByGroupId(group.getId())
                                        .map(msg -> buildPrivateChatListItemResponse(
                                                group,
                                                finalPeerId,
                                                peerInfo.userName(),
                                                peerInfo.avatarUrl(),
                                                msg.getContent(),
                                                msg.getCreatedAt(),
                                                flags.isBlockedByMe(),
                                                flags.isBlockedByPeer()))
                                        .switchIfEmpty(Mono.just(buildPrivateChatListItemResponse(
                                                group,
                                                finalPeerId,
                                                peerInfo.userName(),
                                                peerInfo.avatarUrl(),
                                                null,
                                                null,
                                                flags.isBlockedByMe(),
                                                flags.isBlockedByPeer())));
                            });
                });
    }

    private PrivateChatListItemResponse buildPrivateChatListItemResponse(
            ChatGroup group,
            Long peerMemberId,
            String peerUserName,
            String peerAvatarUrl,
            String lastMessagePreview,
            LocalDateTime lastMessageAt,
            boolean blockedByMe,
            boolean blockedByPeer) {
        return new PrivateChatListItemResponse(
                group.getId(),
                group.getType(),
                group.getTitle(),
                group.getCreatedBy(),
                group.getCreatedAt(),
                group.getUpdatedAt(),
                peerMemberId,
                peerUserName,
                peerAvatarUrl,
                lastMessagePreview,
                lastMessageAt,
                blockedByMe,
                blockedByPeer);
    }

    public Mono<PaginatedResponse<GroupChatListItemResponse>> getListGroupChatsWithSummary(
            Long memberId, String text, int page, int size) {
        if (memberId == null) {
            return Mono.error(new ApplicationException(ErrorCode.USER_NOT_FOUND, "Member ID must not be null"));
        }

        return getListChatGroupsByType(memberId, ChatType.GROUP.getValue())
                .flatMapMany(Flux::fromIterable)
                .concatMap(this::buildGroupChatListItem)
                .collectList()
                .flatMap(list -> {
                    list.sort(Comparator.comparing(
                            (GroupChatListItemResponse item) ->
                                    item.getLastMessageAt() != null ? item.getLastMessageAt() : item.getUpdatedAt()
                    ).reversed());

                    List<GroupChatListItemResponse> filtered = (text == null || text.isBlank())
                            ? list
                            : list.stream()
                                  .filter(item -> item.getTitle() != null &&
                                                  item.getTitle().toLowerCase().contains(text.toLowerCase()))
                                  .toList();

                    return PaginationHelper.paginateList(filtered, page, size);
                });
    }

    private Mono<GroupChatListItemResponse> buildGroupChatListItem(ChatGroup group) {
        Mono<Long> memberCountMono = chatGroupMemberRepository.findByGroupId(group.getId())
                .count();

        Mono<GroupChatListItemResponse> withLastMessage = memberCountMono.flatMap(count ->
                chatMessageRepository.findLastByGroupId(group.getId())
                        .map(msg -> new GroupChatListItemResponse(
                                group.getId(),
                                group.getType(),
                                group.getTitle(),
                                group.getCreatedBy(),
                                group.getCreatedAt(),
                                group.getUpdatedAt(),
                                count,
                                msg.getContent(),
                                msg.getCreatedAt()
                        ))
                        .switchIfEmpty(Mono.just(new GroupChatListItemResponse(
                                group.getId(),
                                group.getType(),
                                group.getTitle(),
                                group.getCreatedBy(),
                                group.getCreatedAt(),
                                group.getUpdatedAt(),
                                count,
                                null,
                                null
                        )))
        );

        return withLastMessage;
    }

    private Mono<ChatGroup> createPrivateChat(Long memberAId, Long memberBId) {
        ChatGroup newGroup = ChatGroup.builder()
                .type(ChatType.PRIVATE)
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
                            .role(ChatRole.MEMBER)
                            .joinedAt(LocalDateTime.now())
                            .build();

                        ChatGroupMember memberB = ChatGroupMember.builder()
                            .groupId(savedGroup.getId())
                            .memberId(memberBId)
                            .role(ChatRole.MEMBER)
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
                                         String metadata,
                                         String chatType) {
        if (groupId == null || senderMemberId == null) {
            return Mono.error(new ApplicationException(ErrorCode.USER_NOT_FOUND, "Group ID and sender ID must not be null"));
        }

        LocalDateTime now = LocalDateTime.now();
        String finalMessageType = messageType != null ? messageType : "TEXT";
        String finalMetadata = metadata != null ? metadata : "null";

        Mono<ChatMessage> insertMessage = chatMessageRepository.insertMessage(
                groupId,
                senderMemberId,
                content,
                finalMessageType,
                finalMetadata,
                now
        );

        if (ChatType.PRIVATE.getValue().equals(chatType)) {
            return userBlockService.assertSenderCanSendMessage(senderMemberId, groupId)
                    .then(insertMessage);
        }

        return insertMessage;
    }

    public Mono<GroupBlockedMembersContextResponse> getGroupBlockedMembersContext(
            Long currentMemberId,
            Long groupId) {
        if (currentMemberId == null || groupId == null) {
            return Mono.error(new ApplicationException(
                    ErrorCode.RESOURCES_NOT_FOUND,
                    "Current member ID and group ID must not be null"));
        }

        return chatGroupRepository.findById(groupId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.RESOURCES_NOT_FOUND, "Chat group not found")))
                .flatMap(group -> {
                    if (!ChatType.GROUP.equals(group.getType())) {
                        return Mono.error(new ApplicationException(
                                ErrorCode.RESOURCES_NOT_FOUND,
                                "Blocked members context is only available for group chats"));
                    }

                    return chatGroupMemberRepository.findByGroupIdAndMemberId(groupId, currentMemberId)
                            .switchIfEmpty(Mono.error(new ApplicationException(
                                    ErrorCode.CHAT_USER_NOT_GROUP_MEMBER,
                                    "Current user is not a member of this chat group")))
                            .flatMap(currentMember -> userBlockService
                                    .findBlockedMembersInGroupByBlocker(currentMemberId, groupId)
                                    .collectList()
                                    .map(blockedMembers -> {
                                        String role = currentMember.getRole() != null
                                                ? currentMember.getRole().getValue()
                                                : ChatRole.MEMBER.getValue();
                                        return new GroupBlockedMembersContextResponse(blockedMembers, role);
                                    }));
                });
    }


    public Flux<ChatMessage> getMessages(Long groupId, int page, int size) {
        int limit = Math.max(size, 1);
        int offset = Math.max(page, 0) * limit;
        return chatMessageRepository.findByGroupIdWithPagination(groupId, limit, offset);
    }

    public Flux<ChatMessageResponse> getMessagesWithSenderInfo(Long groupId, int page, int size) {
        int limit = Math.max(size, 1);
        int offset = Math.max(page, 0) * limit;
        return chatMessageRepository.findByGroupIdWithSenderInfoAndPagination(groupId, limit, offset);
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
    @Transactional
    public Mono<ChatGroup> createGroupChat(Long creatorMemberId, String title, List<Long> memberIds) {
        if (creatorMemberId == null) {
            return Mono.error(new ApplicationException(ErrorCode.USER_NOT_FOUND, "Creator member ID must not be null"));
        }

        if (memberIds == null || memberIds.size() < 2) {
            return Mono.error(new ApplicationException(ErrorCode.RESOURCES_NOT_FOUND, "Group chat requires at least 2 other members (3 total including creator)"));
        }

        List<Long> distinctOthers = memberIds.stream()
                .filter(id -> !creatorMemberId.equals(id))
                .distinct()
                .toList();

        // 1 (creator) + distinctOthers
        if (distinctOthers.size() + 1 > MAX_GROUP_SIZE) {
            return Mono.error(new ApplicationException(
                    ErrorCode.GROUP_MEMBER_LIMIT_EXCEEDED,
                    "Nhóm chat chỉ được phép tối đa " + MAX_GROUP_SIZE + " thành viên"));
        }

        LocalDateTime now = LocalDateTime.now();
        String resolvedTitle = (title != null && !title.isBlank()) ? title.trim() : null;

        ChatGroup group = ChatGroup.builder()
                .type(ChatType.GROUP)
                .title(resolvedTitle)
                .createdBy(creatorMemberId)
                .createdAt(now)
                .updatedAt(now)
                .build();

        return chatGroupRepository.save(group)
                .flatMap(savedGroup -> {
                    ChatGroupMember owner = ChatGroupMember.builder()
                            .groupId(savedGroup.getId())
                            .memberId(creatorMemberId)
                            .role(ChatRole.OWNER)
                            .joinedAt(now)
                            .build();

                    List<ChatGroupMember> others = distinctOthers.stream()
                            .map(id -> ChatGroupMember.builder()
                                    .groupId(savedGroup.getId())
                                    .memberId(id)
                                    .role(ChatRole.MEMBER)
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
                                                .role(ChatRole.MEMBER)
                                                .joinedAt(now)
                                                .build())
                                        .toList();

                                if (newMembers.isEmpty()) {
                                    return Mono.empty();
                                }

                                if (existingMembers.size() + newMembers.size() > MAX_GROUP_SIZE) {
                                    return Mono.error(new ApplicationException(
                                            ErrorCode.GROUP_MEMBER_LIMIT_EXCEEDED,
                                            "Nhóm chat chỉ được phép tối đa " + MAX_GROUP_SIZE + " thành viên. Hiện có "
                                                    + existingMembers.size() + " thành viên, chỉ có thể thêm tối đa "
                                                    + (MAX_GROUP_SIZE - existingMembers.size()) + " người nữa"));
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
     * Get members of a group with profile info.
     * Only existing group members can view the list.
     */
    public Mono<PaginatedResponse<ChatGroupMemberItemResponse>> getGroupMembersWithProfile(
            Long groupId,
            Long currentMemberId,
            String text,
            int page,
            int size) {
        if (groupId == null || currentMemberId == null) {
            return Mono.error(new ApplicationException(
                    ErrorCode.RESOURCES_NOT_FOUND,
                    "Group ID and current member ID must not be null"));
        }

        int limit = Math.max(size, 1);
        int offset = Math.max(page, 0) * limit;
        String namePattern = toContainsPattern(text);

        return chatGroupMemberRepository.findByGroupIdAndMemberId(groupId, currentMemberId)
                .switchIfEmpty(Mono.error(new ApplicationException(
                        ErrorCode.CHAT_USER_NOT_GROUP_MEMBER,
                        "Current user is not a member of this chat group")))
                .flatMap(ignored -> PaginationHelper.paginate(
                        chatGroupMemberRepository.findMembersByGroupIdWithProfile(groupId, namePattern, limit, offset),
                        chatGroupMemberRepository.countMembersByGroupIdWithNameFilter(groupId, namePattern),
                        page,
                        limit));
    }

    private static String toContainsPattern(String text) {
        if (text == null || text.isBlank()) {
            return null;
        }
        return "%" + text.trim() + "%";
    }

    /**
     * Get chat group metadata including title, created_by, created_at, and members.
     */
    public Mono<ChatGroupMetadataResponse> getChatGroupMetadata(Long groupId) {
        if (groupId == null) {
            return Mono.error(new ApplicationException(ErrorCode.RESOURCES_NOT_FOUND, "Group ID must not be null"));
        }

        return chatGroupRepository.findById(groupId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.RESOURCES_NOT_FOUND, "Chat group not found")))
                .flatMap(group -> chatGroupMemberRepository.findByGroupId(groupId)
                        .collectList()
                        .map(members -> ChatGroupMetadataResponse.builder()
                                .id(group.getId())
                                .type(group.getType())
                                .title(group.getTitle())
                                .createdBy(group.getCreatedBy())
                                .createdAt(group.getCreatedAt())
                                .updatedAt(group.getUpdatedAt())
                                .members(members)
                                .build()
                        )
                );
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
    @Transactional
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
                                                        .then(chatGroupMemberRepository.updateRoleToOwnerByGroupIdAndMemberId(groupId, newOwnerMember.getMemberId()))
                                                        .then(chatGroupMemberRepository.deleteByGroupIdAndMemberId(groupId, memberId));
                                            });
                                })
                );
    }

    /**
     * Delete a group entirely (owner only).
     */
    @Transactional
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
    

