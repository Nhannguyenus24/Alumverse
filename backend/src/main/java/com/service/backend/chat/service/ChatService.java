package com.service.backend.chat.service;

import com.service.backend.chat.entity.ChatGroup;
import com.service.backend.chat.entity.ChatGroupMember;
import com.service.backend.chat.entity.ChatMessage;
import com.service.backend.chat.repository.ChatGroupMemberRepository;
import com.service.backend.chat.repository.ChatGroupRepository;
import com.service.backend.chat.repository.ChatMessageRepository;
import com.service.backend.shared.constants.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

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
}

