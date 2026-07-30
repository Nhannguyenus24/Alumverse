package com.service.backend.chat.service;

import com.service.backend.chat.dao.ChatConversationRequestRepository;
import com.service.backend.chat.dao.ChatGroupMemberRepository;
import com.service.backend.chat.dao.ChatGroupRepository;
import com.service.backend.chat.dao.UserBlockRepository;
import com.service.backend.chat.dto.BlockStatusResponse;
import com.service.backend.chat.dto.BlockedMemberInGroupItemResponse;
import com.service.backend.chat.dto.BlockedMemberItemResponse;
import com.service.backend.chat.dto.PeerActiveStatusResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.entity.ChatConversationRequest;
import com.service.backend.shared.entity.UserBlock;
import com.service.backend.shared.enums.ConversationRequestStatus;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.utils.PaginationHelper;
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
public class UserBlockService {

    private final UserBlockRepository userBlockRepository;
    private final ChatConversationRequestRepository chatConversationRequestRepository;
    private final ChatGroupRepository chatGroupRepository;
    private final ChatGroupMemberRepository chatGroupMemberRepository;

    @Transactional
    public Mono<UserBlock> blockUser(Long blockerMemberId, Long targetMemberId) {
        return validateBlockRequest(blockerMemberId, targetMemberId)
                .then(userBlockRepository.countByBlockerMemberIdAndBlockedMemberId(blockerMemberId, targetMemberId))
                .flatMap(sameDirectionCount -> {
                    if (sameDirectionCount > 0) {
                        return Mono.error(new ApplicationException(
                                ErrorCode.USER_ALREADY_BLOCKED,
                                "You have already blocked this member"));
                    }

                    return userBlockRepository.countAnyBlockBetweenMembers(blockerMemberId, targetMemberId);
                })
                .flatMap(existingCount -> {
                    if (existingCount > 0) {
                        return Mono.error(new ApplicationException(
                                ErrorCode.USER_BLOCK_RELATIONSHIP_EXISTS,
                                "A block relationship already exists between these members"));
                    }

                    UserBlock block = UserBlock.builder()
                            .blockerMemberId(blockerMemberId)
                            .blockedMemberId(targetMemberId)
                            .createdAt(LocalDateTime.now())
                            .build();

                    return userBlockRepository.save(block)
                            // Blocking severs any existing connection between the two members:
                            // the conversation request is marked as disconnected and the shared
                            // private chat is removed from both sides. See severConnection.
                            .flatMap(saved -> severConnection(blockerMemberId, targetMemberId)
                                    .thenReturn(saved))
                            .doOnSuccess(saved -> log.info(
                                    "User blocked: blocker={}, blocked={}",
                                    blockerMemberId,
                                    targetMemberId));
                });
    }

    /**
     * Removes the network connection between two members when one blocks the other.
     * <ol>
     *   <li>Downgrades their conversation request away from {@code ACCEPTED} (to
     *       {@code DISCONNECTED} with no cooldown), so the pair no longer appears in the
     *       connections list and is not treated as a rejected request. The record is kept so
     *       a fresh request after an eventual unblock can reuse the existing chat group.</li>
     *   <li>Removes both members from the shared private chat group, so the thread
     *       disappears from both users' chat lists. Messages and the group row are
     *       preserved and are restored intact if the pair reconnects and re-accepts.</li>
     * </ol>
     * Connections are not auto-restored on unblock — reconnecting requires a new request.
     */
    private Mono<Void> severConnection(Long memberAId, Long memberBId) {
        long memberLowId = Math.min(memberAId, memberBId);
        long memberHighId = Math.max(memberAId, memberBId);

        return chatConversationRequestRepository.findByMemberPair(memberLowId, memberHighId)
                .flatMap(this::downgradeConnectionRequest)
                .then(removePrivateChatMembership(memberAId, memberBId));
    }

    private Mono<Void> downgradeConnectionRequest(ChatConversationRequest request) {
        // Already not connected (a prior rejection/disconnect) — nothing to downgrade.
        if (request.getStatus() == ConversationRequestStatus.REJECTED
                || request.getStatus() == ConversationRequestStatus.DISCONNECTED) {
            return Mono.empty();
        }
        request.setStatus(ConversationRequestStatus.DISCONNECTED);
        request.setCooldownUntil(null);
        request.setUpdatedAt(LocalDateTime.now());
        return chatConversationRequestRepository.save(request)
                .doOnSuccess(saved -> log.info(
                        "Connection severed by block: requestId={}, requester={}, target={}",
                        saved.getId(), saved.getRequesterMemberId(), saved.getTargetMemberId()))
                .then();
    }

    private Mono<Void> removePrivateChatMembership(Long memberAId, Long memberBId) {
        // findPrivateChatBetweenMembers only resolves when both members are still in the
        // group (i.e. an accepted connection), so a pending request is a no-op here.
        return chatGroupRepository.findPrivateChatBetweenMembers(memberAId, memberBId)
                .flatMap(group -> chatGroupMemberRepository.deleteByGroupId(group.getId()))
                .then();
    }

    @Transactional
    public Mono<Void> unblockUser(Long blockerMemberId, Long targetMemberId) {
        if (blockerMemberId.equals(targetMemberId)) {
            return Mono.error(new ApplicationException(
                    ErrorCode.CANNOT_BLOCK_SELF,
                    "Cannot unblock yourself"));
        }

        return assertTargetActive(targetMemberId)
                .then(userBlockRepository.countByBlockerMemberIdAndBlockedMemberId(blockerMemberId, targetMemberId))
                .flatMap(count -> {
                    if (count == 0) {
                        return Mono.error(new ApplicationException(
                                ErrorCode.USER_NOT_BLOCKED,
                                "You have not blocked this member"));
                    }

                    return userBlockRepository.deleteByBlockerMemberIdAndBlockedMemberId(blockerMemberId, targetMemberId)
                            .doOnSuccess(ignored -> log.info(
                                    "User unblocked: blocker={}, blocked={}",
                                    blockerMemberId,
                                    targetMemberId))
                            .then();
                });
    }

    private Mono<Void> assertTargetActive(Long targetMemberId) {
        return userBlockRepository.existsActiveUserById(targetMemberId)
                .flatMap(active -> active
                        ? Mono.empty()
                        : Mono.error(new ApplicationException(
                                ErrorCode.USER_NOT_FOUND,
                                "Target member is not active")));
    }

    public Mono<BlockStatusResponse> getBlockStatus(Long blockerMemberId, Long targetMemberId) {
        return userBlockRepository.countByBlockerMemberIdAndBlockedMemberId(blockerMemberId, targetMemberId)
                .map(count -> new BlockStatusResponse(targetMemberId, count > 0));
    }

    /**
     * Whether the target member's account is eligible to receive messages
     * (status ACTIVE or UNVERIFIED). Used by the private chat UI to warn the
     * current user and disable the composer when the peer's account has been
     * suspended, banned, disabled or deleted.
     */
    public Mono<PeerActiveStatusResponse> getPeerActiveStatus(Long targetMemberId) {
        return userBlockRepository.existsMessagingEligibleUserById(targetMemberId)
                .map(active -> new PeerActiveStatusResponse(targetMemberId, active));
    }

    public Mono<PaginatedResponse<BlockedMemberItemResponse>> searchBlockedMembers(
            Long blockerMemberId,
            String fullName,
            int page,
            int size) {

        String fullNamePattern = toContainsPattern(fullName);
        int offset = page * size;

        Mono<Long> totalMono = userBlockRepository.countBlockedMembersByBlockerMemberId(
                blockerMemberId,
                fullNamePattern);

        return PaginationHelper.paginate(
                userBlockRepository.searchBlockedMembersByBlockerMemberId(
                        blockerMemberId,
                        fullNamePattern,
                        size,
                        offset),
                totalMono,
                page,
                size);
    }

    private static String toContainsPattern(String raw) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        return "%" + raw.trim() + "%";
    }

    public Mono<Void> assertCommunicationNotBlocked(Long memberAId, Long memberBId) {
        return userBlockRepository.countAnyBlockBetweenMembers(memberAId, memberBId)
                .flatMap(count -> {
                    if (count > 0) {
                        return Mono.error(new ApplicationException(
                                ErrorCode.USER_COMMUNICATION_BLOCKED,
                                "You cannot communicate with this member while a block is active"));
                    }
                    return Mono.empty();
                });
    }

    public Mono<Void> assertSenderCanSendMessage(Long senderMemberId, Long groupId) {
        return userBlockRepository.countBlockStatusInGroup(senderMemberId, groupId)
                .flatMap(count -> {
                    if (count > 0) {
                        return Mono.error(new ApplicationException(
                                ErrorCode.USER_COMMUNICATION_BLOCKED,
                                "You cannot send messages while a block is active"));
                    }
                    return Mono.empty();
                });
    }

    public Flux<BlockedMemberInGroupItemResponse> findBlockedMembersInGroupByBlocker(
            Long blockerMemberId,
            Long groupId) {
        return userBlockRepository.findBlockedMembersInGroupByBlocker(blockerMemberId, groupId);
    }

    private Mono<Void> validateBlockRequest(Long blockerMemberId, Long targetMemberId) {
        // Blocking is a personal, org-agnostic action: anyone may block anyone (except self).
        if (blockerMemberId.equals(targetMemberId)) {
            return Mono.error(new ApplicationException(
                    ErrorCode.CANNOT_BLOCK_SELF,
                    "You cannot block yourself"));
        }
        return Mono.empty();
    }
}
