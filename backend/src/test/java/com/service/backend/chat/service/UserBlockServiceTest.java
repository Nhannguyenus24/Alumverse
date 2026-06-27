package com.service.backend.chat.service;

import com.service.backend.chat.dao.UserBlockRepository;
import com.service.backend.shared.entity.UserBlock;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.user.dao.UserOrganizationMemberRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserBlockService Unit Tests")
class UserBlockServiceTest {

    @Mock private UserBlockRepository userBlockRepository;
    @Mock private UserOrganizationMemberRepository userOrganizationMemberRepository;

    @InjectMocks
    private UserBlockService userBlockService;

    // ─── blockUser ────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("blockUser()")
    class BlockUser {

        @Test
        @DisplayName("should fail when blocking yourself")
        void blockUser_selfBlock() {
            when(userBlockRepository.countByBlockerMemberIdAndBlockedMemberId(1L, 1L)).thenReturn(Mono.just(0L));
            StepVerifier.create(userBlockService.blockUser(1L, 1L, 1))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.CANNOT_BLOCK_SELF)
                    .verify();
        }

        @Test
        @DisplayName("should fail when block relationship already exists (same direction)")
        void blockUser_alreadyBlocked() {
            when(userOrganizationMemberRepository.findByOrganizationIdAndUserId(1, 2))
                    .thenReturn(Mono.just(com.service.backend.shared.entity.OrganizationMember.builder().build()));
            when(userBlockRepository.countByBlockerMemberIdAndBlockedMemberId(1L, 2L))
                    .thenReturn(Mono.just(1L));

            StepVerifier.create(userBlockService.blockUser(1L, 2L, 1))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.USER_ALREADY_BLOCKED)
                    .verify();
        }

        @Test
        @DisplayName("should block user successfully")
        void blockUser_success() {
            UserBlock savedBlock = UserBlock.builder()
                    .id(1L)
                    .blockerMemberId(1L)
                    .blockedMemberId(2L)
                    .createdAt(LocalDateTime.now())
                    .build();

            when(userOrganizationMemberRepository.findByOrganizationIdAndUserId(1, 2))
                    .thenReturn(Mono.just(com.service.backend.shared.entity.OrganizationMember.builder().build()));
            when(userBlockRepository.countByBlockerMemberIdAndBlockedMemberId(1L, 2L))
                    .thenReturn(Mono.just(0L));
            when(userBlockRepository.countAnyBlockBetweenMembers(1L, 2L))
                    .thenReturn(Mono.just(0L));
            when(userBlockRepository.save(any())).thenReturn(Mono.just(savedBlock));

            StepVerifier.create(userBlockService.blockUser(1L, 2L, 1))
                    .assertNext(block -> {
                        assertThat(block.getBlockerMemberId()).isEqualTo(1L);
                        assertThat(block.getBlockedMemberId()).isEqualTo(2L);
                    })
                    .verifyComplete();
        }
    }

    // ─── unblockUser ──────────────────────────────────────────────────────────

    @Nested
    @DisplayName("unblockUser()")
    class UnblockUser {

        @Test
        @DisplayName("should unblock user successfully")
        void unblockUser_success() {
            when(userBlockRepository.countByBlockerMemberIdAndBlockedMemberId(1L, 2L))
                    .thenReturn(Mono.just(1L));
            when(userBlockRepository.deleteByBlockerMemberIdAndBlockedMemberId(1L, 2L)).thenReturn(Mono.just(1));

            StepVerifier.create(userBlockService.unblockUser(1L, 2L))
                    .verifyComplete();
        }

        @Test
        @DisplayName("should fail when user is not blocked")
        void unblockUser_notBlocked() {
            when(userBlockRepository.countByBlockerMemberIdAndBlockedMemberId(1L, 2L))
                    .thenReturn(Mono.just(0L));

            StepVerifier.create(userBlockService.unblockUser(1L, 2L))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.USER_NOT_BLOCKED)
                    .verify();
        }
    }

    // ─── getBlockStatus ───────────────────────────────────────────────────────

    @Nested
    @DisplayName("getBlockStatus()")
    class GetBlockStatus {

        @Test
        @DisplayName("should return blocked=true when A blocks B")
        void getBlockStatus_blockedByA() {
            when(userBlockRepository.countByBlockerMemberIdAndBlockedMemberId(1L, 2L))
                    .thenReturn(Mono.just(1L));

            StepVerifier.create(userBlockService.getBlockStatus(1L, 2L))
                    .assertNext(status -> {
                        assertThat(status.isBlocked()).isTrue();
                    })
                    .verifyComplete();
        }

        @Test
        @DisplayName("should return blocked=false when no block exists")
        void getBlockStatus_noBlock() {
            when(userBlockRepository.countByBlockerMemberIdAndBlockedMemberId(1L, 2L))
                    .thenReturn(Mono.just(0L));

            StepVerifier.create(userBlockService.getBlockStatus(1L, 2L))
                    .assertNext(status -> {
                        assertThat(status.isBlocked()).isFalse();
                    })
                    .verifyComplete();
        }
    }

    // ─── assertCommunicationNotBlocked ────────────────────────────────────────

    @Nested
    @DisplayName("assertCommunicationNotBlocked()")
    class AssertCommunicationNotBlocked {

        @Test
        @DisplayName("should complete when no block exists")
        void assertCommunicationNotBlocked_noBlock() {
            when(userBlockRepository.countAnyBlockBetweenMembers(1L, 2L)).thenReturn(Mono.just(0L));

            StepVerifier.create(userBlockService.assertCommunicationNotBlocked(1L, 2L))
                    .verifyComplete();
        }

        @Test
        @DisplayName("should fail when block exists")
        void assertCommunicationNotBlocked_blocked() {
            when(userBlockRepository.countAnyBlockBetweenMembers(1L, 2L)).thenReturn(Mono.just(1L));

            StepVerifier.create(userBlockService.assertCommunicationNotBlocked(1L, 2L))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.USER_COMMUNICATION_BLOCKED)
                    .verify();
        }
    }
}
