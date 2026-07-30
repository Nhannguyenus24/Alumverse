package com.service.backend.chat.service;

import com.service.backend.chat.dao.ChatGroupMemberRepository;
import com.service.backend.chat.dao.ChatGroupRepository;
import com.service.backend.chat.dao.ChatMessageRepository;
import com.service.backend.shared.entity.ChatGroup;
import com.service.backend.shared.entity.ChatGroupMember;
import com.service.backend.shared.enums.ChatRole;
import com.service.backend.shared.enums.ChatType;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import org.reactivestreams.Publisher;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ChatService Unit Tests")
class ChatServiceTest {

    @Mock private ChatGroupRepository chatGroupRepository;
    @Mock private ChatGroupMemberRepository chatGroupMemberRepository;
    @Mock private ChatMessageRepository chatMessageRepository;
    @Mock private UserBlockService userBlockService;
    @Mock private com.service.backend.shared.service.SseService sseService;

    @InjectMocks
    private ChatService chatService;

    // ─── getPrivateChat ───────────────────────────────────────────────────────

    @Nested
    @DisplayName("getPrivateChat()")
    class GetPrivateChat {

        @Test
        @DisplayName("should return existing private chat")
        void getPrivateChat_existingChat() {
            ChatGroup existingChat = ChatGroup.builder()
                    .id(1L)
                    .type(ChatType.PRIVATE)
                    .build();

            when(chatGroupRepository.findPrivateChatBetweenMembers(1L, 2L))
                    .thenReturn(Mono.just(existingChat));

            StepVerifier.create(chatService.getPrivateChat(1L, 2L))
                    .assertNext(group -> assertThat(group.getType()).isEqualTo(ChatType.PRIVATE))
                    .verifyComplete();
        }

        @Test
        @DisplayName("should return empty when no private chat exists")
        void getPrivateChat_notFound() {
            when(chatGroupRepository.findPrivateChatBetweenMembers(1L, 2L))
                    .thenReturn(Mono.empty());

            StepVerifier.create(chatService.getPrivateChat(1L, 2L))
                    .verifyComplete();
        }
    }

    // ─── createGroupChat ──────────────────────────────────────────────────────

    @Nested
    @DisplayName("createGroupChat()")
    class CreateGroupChat {

        @Test
        @DisplayName("should fail when too many members (over limit of 10)")
        void createGroupChat_tooManyMembers() {
            List<Long> tooManyMembers = List.of(2L, 3L, 4L, 5L, 6L, 7L, 8L, 9L, 10L, 11L); // 10 others + creator = 11

            StepVerifier.create(chatService.createGroupChat(1L, "My Group", tooManyMembers))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.GROUP_MEMBER_LIMIT_EXCEEDED)
                    .verify();
        }

        @Test
        @DisplayName("should create group chat successfully with valid members")
        void createGroupChat_success() {
            List<Long> memberIds = List.of(2L, 3L, 4L);

            ChatGroup savedGroup = ChatGroup.builder()
                    .id(1L)
                    .title("My Group")
                    .type(ChatType.GROUP)
                    .createdAt(LocalDateTime.now())
                    .build();

            when(chatGroupRepository.save(any())).thenReturn(Mono.just(savedGroup));
            when(chatGroupMemberRepository.saveAll(any(Publisher.class))).thenReturn(Flux.empty());

            StepVerifier.create(chatService.createGroupChat(1L, "My Group", memberIds))
                    .assertNext(group -> {
                        assertThat(group.getTitle()).isEqualTo("My Group");
                        assertThat(group.getType()).isEqualTo(ChatType.GROUP);
                    })
                    .verifyComplete();
        }
    }

    // ─── updateGroupInfo ─────────────────────────────────────────────────────

    @Nested
    @DisplayName("updateGroupInfo()")
    class UpdateGroupInfo {

        @Test
        @DisplayName("should fail when requester is not owner")
        void updateGroupInfo_notOwner() {
            // Group was created by 1L, requester is 99L
            when(chatGroupRepository.findById(1L)).thenReturn(Mono.just(ChatGroup.builder().createdBy(1L).type(ChatType.GROUP).build()));

            StepVerifier.create(chatService.updateGroupInfo(1L, 99L, "New Title"))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.FORBIDDEN)
                    .verify();
        }

        @Test
        @DisplayName("should update group title successfully")
        void updateGroupInfo_success() {
            ChatGroup updatedGroup = ChatGroup.builder()
                    .id(1L)
                    .createdBy(1L)
                    .title("New Title")
                    .type(ChatType.GROUP)
                    .build();

            when(chatGroupRepository.findById(1L)).thenReturn(Mono.just(updatedGroup));
            when(chatGroupRepository.save(any())).thenReturn(Mono.just(updatedGroup));

            StepVerifier.create(chatService.updateGroupInfo(1L, 1L, "New Title"))
                    .assertNext(group -> assertThat(group.getTitle()).isEqualTo("New Title"))
                    .verifyComplete();
        }
    }

    // ─── removeMemberFromGroup ────────────────────────────────────────────────

    @Nested
    @DisplayName("removeMemberFromGroup()")
    class RemoveMemberFromGroup {

        @Test
        @DisplayName("should fail when requester is not owner")
        void removeMemberFromGroup_notOwner() {
            when(chatGroupRepository.findById(1L)).thenReturn(Mono.just(ChatGroup.builder().createdBy(1L).type(ChatType.GROUP).build()));

            StepVerifier.create(chatService.removeMemberFromGroup(1L, 99L, 2L))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.FORBIDDEN)
                    .verify();
        }
    }

    // ─── leaveGroup ──────────────────────────────────────────────────────────

    @Nested
    @DisplayName("leaveGroup()")
    class LeaveGroup {

        @Test
        @DisplayName("should fail when user is not a group member")
        void leaveGroup_notMember() {
            when(chatGroupRepository.findById(1L)).thenReturn(Mono.just(ChatGroup.builder().createdBy(99L).type(ChatType.GROUP).build()));
            when(chatGroupMemberRepository.findByGroupIdAndMemberId(1L, 1L))
                    .thenReturn(Mono.empty());

            StepVerifier.create(chatService.leaveGroup(1L, 1L))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.RESOURCES_NOT_FOUND)
                    .verify();
        }

        @Test
        @DisplayName("should leave group successfully (normal member)")
        void leaveGroup_success() {
            ChatGroupMember member = ChatGroupMember.builder()
                    .groupId(1L)
                    .memberId(1L)
                    .role(ChatRole.MEMBER)
                    .build();

            when(chatGroupRepository.findById(1L)).thenReturn(Mono.just(ChatGroup.builder().createdBy(99L).type(ChatType.GROUP).build()));
            when(chatGroupMemberRepository.findByGroupIdAndMemberId(1L, 1L))
                    .thenReturn(Mono.just(member));
            when(chatGroupMemberRepository.deleteByGroupIdAndMemberId(1L, 1L)).thenReturn(Mono.empty());

            StepVerifier.create(chatService.leaveGroup(1L, 1L))
                    .verifyComplete();
        }
    }

    // ─── deleteGroup ──────────────────────────────────────────────────────────

    @Nested
    @DisplayName("deleteGroup()")
    class DeleteGroup {

        @Test
        @DisplayName("should fail when requester is not owner")
        void deleteGroup_notOwner() {
            when(chatGroupRepository.findById(1L)).thenReturn(Mono.just(ChatGroup.builder().createdBy(1L).type(ChatType.GROUP).build()));

            StepVerifier.create(chatService.deleteGroup(1L, 99L))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.FORBIDDEN)
                    .verify();
        }
    }
}
