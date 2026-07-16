package com.service.backend.chat.service;

import com.service.backend.chat.dao.UserBlockRepository;
import com.service.backend.chat.dto.BlockStatusResponse;
import com.service.backend.chat.dto.BlockedMemberInGroupItemResponse;
import com.service.backend.chat.dto.BlockedMemberItemResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.entity.UserBlock;
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
                            .doOnSuccess(saved -> log.info(
                                    "User blocked: blocker={}, blocked={}",
                                    blockerMemberId,
                                    targetMemberId));
                });
    }

    @Transactional
    public Mono<Void> unblockUser(Long blockerMemberId, Long targetMemberId) {
        if (blockerMemberId.equals(targetMemberId)) {
            return Mono.error(new ApplicationException(
                    ErrorCode.CANNOT_BLOCK_SELF,
                    "Cannot unblock yourself"));
        }

        return userBlockRepository.countByBlockerMemberIdAndBlockedMemberId(blockerMemberId, targetMemberId)
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

    public Mono<BlockStatusResponse> getBlockStatus(Long blockerMemberId, Long targetMemberId) {
        return userBlockRepository.countByBlockerMemberIdAndBlockedMemberId(blockerMemberId, targetMemberId)
                .map(count -> new BlockStatusResponse(targetMemberId, count > 0));
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
