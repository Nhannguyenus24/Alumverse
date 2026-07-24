package com.service.backend.chat.service;

import com.service.backend.chat.dao.ChatConversationRequestRepository;
import com.service.backend.chat.dao.ChatGroupMemberRepository;
import com.service.backend.chat.dao.ChatGroupRepository;
import com.service.backend.chat.dao.UserBlockRepository;
import com.service.backend.shared.entity.ChatConversationRequest;
import com.service.backend.shared.entity.ChatGroup;
import com.service.backend.shared.entity.UserBlock;
import com.service.backend.shared.enums.ConversationRequestStatus;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import org.mockito.ArgumentCaptor;
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
    @Mock private ChatConversationRequestRepository chatConversationRequestRepository;
    @Mock private ChatGroupRepository chatGroupRepository;
    @Mock private ChatGroupMemberRepository chatGroupMemberRepository;

    @InjectMocks
    private UserBlockService userBlockService;

    // ─── blockUser ────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("blockUser()")
    class BlockUser {

        @Test
        @DisplayName("should fail when blocking yourself")
        void blockUser_selfBlock() {
            // .then(...) eagerly builds the count Mono even though the self-block error
            // short-circuits before it is subscribed, so the stub must still be present.
            when(userBlockRepository.countByBlockerMemberIdAndBlockedMemberId(1L, 1L)).thenReturn(Mono.just(0L));
            StepVerifier.create(userBlockService.blockUser(1L, 1L))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.CANNOT_BLOCK_SELF)
                    .verify();
        }

        @Test
        @DisplayName("should fail when block relationship already exists (same direction)")
        void blockUser_alreadyBlocked() {
            when(userBlockRepository.countByBlockerMemberIdAndBlockedMemberId(1L, 2L))
                    .thenReturn(Mono.just(1L));

            StepVerifier.create(userBlockService.blockUser(1L, 2L))
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

            when(userBlockRepository.countByBlockerMemberIdAndBlockedMemberId(1L, 2L))
                    .thenReturn(Mono.just(0L));
            when(userBlockRepository.countAnyBlockBetweenMembers(1L, 2L))
                    .thenReturn(Mono.just(0L));
            when(userBlockRepository.save(any())).thenReturn(Mono.just(savedBlock));
            // No existing connection between the pair — sever is a no-op.
            when(chatConversationRequestRepository.findByMemberPair(1L, 2L)).thenReturn(Mono.empty());
            when(chatGroupRepository.findPrivateChatBetweenMembers(1L, 2L)).thenReturn(Mono.empty());

            StepVerifier.create(userBlockService.blockUser(1L, 2L))
                    .assertNext(block -> {
                        assertThat(block.getBlockerMemberId()).isEqualTo(1L);
                        assertThat(block.getBlockedMemberId()).isEqualTo(2L);
                    })
                    .verifyComplete();
        }

        @Test
        @DisplayName("should sever an existing ACCEPTED connection when blocking")
        void blockUser_seversExistingConnection() {
            UserBlock savedBlock = UserBlock.builder()
                    .id(1L).blockerMemberId(1L).blockedMemberId(2L)
                    .createdAt(LocalDateTime.now()).build();
            ChatConversationRequest connection = ChatConversationRequest.builder()
                    .id(9L).memberLowId(1L).memberHighId(2L)
                    .requesterMemberId(1L).targetMemberId(2L)
                    .chatGroupId(77L)
                    .status(ConversationRequestStatus.ACCEPTED)
                    .cooldownUntil(LocalDateTime.now().plusDays(1))
                    .build();
            ChatGroup privateGroup = ChatGroup.builder().id(77L).build();

            when(userBlockRepository.countByBlockerMemberIdAndBlockedMemberId(1L, 2L)).thenReturn(Mono.just(0L));
            when(userBlockRepository.countAnyBlockBetweenMembers(1L, 2L)).thenReturn(Mono.just(0L));
            when(userBlockRepository.save(any())).thenReturn(Mono.just(savedBlock));
            when(chatConversationRequestRepository.findByMemberPair(1L, 2L)).thenReturn(Mono.just(connection));
            when(chatConversationRequestRepository.save(any())).thenAnswer(inv -> Mono.just(inv.getArgument(0)));
            when(chatGroupRepository.findPrivateChatBetweenMembers(1L, 2L)).thenReturn(Mono.just(privateGroup));
            when(chatGroupMemberRepository.deleteByGroupId(77L)).thenReturn(Mono.empty());

            StepVerifier.create(userBlockService.blockUser(1L, 2L))
                    .assertNext(block -> assertThat(block.getBlockedMemberId()).isEqualTo(2L))
                    .verifyComplete();

            // Connection downgraded to REJECTED with cleared cooldown.
            ArgumentCaptor<ChatConversationRequest> captor = ArgumentCaptor.forClass(ChatConversationRequest.class);
            verify(chatConversationRequestRepository).save(captor.capture());
            assertThat(captor.getValue().getStatus()).isEqualTo(ConversationRequestStatus.REJECTED);
            assertThat(captor.getValue().getCooldownUntil()).isNull();
            // Both members removed from the shared private chat group.
            verify(chatGroupMemberRepository).deleteByGroupId(77L);
        }
    }

    // ─── unblockUser ──────────────────────────────────────────────────────────

    @Nested
    @DisplayName("unblockUser()")
    class UnblockUser {

        @Test
        @DisplayName("should unblock user successfully")
        void unblockUser_success() {
            when(userBlockRepository.existsActiveUserById(2L)).thenReturn(Mono.just(true));
            when(userBlockRepository.countByBlockerMemberIdAndBlockedMemberId(1L, 2L))
                    .thenReturn(Mono.just(1L));
            when(userBlockRepository.deleteByBlockerMemberIdAndBlockedMemberId(1L, 2L)).thenReturn(Mono.just(1));

            StepVerifier.create(userBlockService.unblockUser(1L, 2L))
                    .verifyComplete();
        }

        @Test
        @DisplayName("should fail when user is not blocked")
        void unblockUser_notBlocked() {
            when(userBlockRepository.existsActiveUserById(2L)).thenReturn(Mono.just(true));
            when(userBlockRepository.countByBlockerMemberIdAndBlockedMemberId(1L, 2L))
                    .thenReturn(Mono.just(0L));

            StepVerifier.create(userBlockService.unblockUser(1L, 2L))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.USER_NOT_BLOCKED)
                    .verify();
        }

        @Test
        @DisplayName("should fail when target member is not active")
        void unblockUser_targetNotActive() {
            // .then(...) eagerly builds the count Mono even though the not-active error
            // short-circuits before it is subscribed, so the stub must still be present.
            when(userBlockRepository.existsActiveUserById(2L)).thenReturn(Mono.just(false));
            when(userBlockRepository.countByBlockerMemberIdAndBlockedMemberId(1L, 2L))
                    .thenReturn(Mono.just(1L));

            StepVerifier.create(userBlockService.unblockUser(1L, 2L))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.USER_NOT_FOUND)
                    .verify();

            verify(userBlockRepository, never()).deleteByBlockerMemberIdAndBlockedMemberId(anyLong(), anyLong());
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

    // ─── getPeerActiveStatus ──────────────────────────────────────────────────

    @Nested
    @DisplayName("getPeerActiveStatus()")
    class GetPeerActiveStatus {

        @Test
        @DisplayName("should return active=true when target status is ACTIVE or UNVERIFIED")
        void getPeerActiveStatus_eligible() {
            when(userBlockRepository.existsMessagingEligibleUserById(2L)).thenReturn(Mono.just(true));

            StepVerifier.create(userBlockService.getPeerActiveStatus(2L))
                    .assertNext(status -> {
                        assertThat(status.getPeerMemberId()).isEqualTo(2L);
                        assertThat(status.isActive()).isTrue();
                    })
                    .verifyComplete();
        }

        @Test
        @DisplayName("should return active=false when target status is suspended/banned/deleted/disabled/inactive")
        void getPeerActiveStatus_notEligible() {
            when(userBlockRepository.existsMessagingEligibleUserById(2L)).thenReturn(Mono.just(false));

            StepVerifier.create(userBlockService.getPeerActiveStatus(2L))
                    .assertNext(status -> {
                        assertThat(status.getPeerMemberId()).isEqualTo(2L);
                        assertThat(status.isActive()).isFalse();
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
