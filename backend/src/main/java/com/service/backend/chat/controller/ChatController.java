package com.service.backend.chat.controller;

import com.service.backend.chat.dto.PrivateChatRequest;
import com.service.backend.chat.entity.ChatGroup;
import com.service.backend.chat.entity.ChatGroupMember;
import com.service.backend.chat.entity.ChatMessage;
import com.service.backend.chat.repository.ChatGroupMemberRepository;
import com.service.backend.chat.repository.ChatGroupRepository;
import com.service.backend.chat.service.ChatService;
import com.service.backend.shared.dto.ApiResponse;
import com.service.backend.shared.utils.SecurityUtils;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@Validated
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final ChatGroupMemberRepository chatGroupMemberRepository;
    private final ChatGroupRepository chatGroupRepository;

    /**
     * 1. List PRIVATE chat groups of the authenticated member.
     */
    @GetMapping("/groups")
    public Mono<ResponseEntity<ApiResponse<List<ChatGroup>>>> listPrivateChats(
            @RequestParam(value = "type", defaultValue = "PRIVATE") String type) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(memberId -> chatGroupMemberRepository.findByMemberId(memberId)
                        .map(ChatGroupMember::getGroupId)
                        .distinct()
                        .flatMap(chatGroupRepository::findById)
                        .filter(group -> type == null || type.equalsIgnoreCase(group.getType()))
                        .collectList())
                .map(groups -> ResponseEntity
                        .ok(new ApiResponse<>("Chat groups retrieved successfully", groups)));
    }

    /**
     * 2. Get (or create) a PRIVATE chat between the authenticated member and target member.
     */
    @PostMapping("/private")
    public Mono<ResponseEntity<ApiResponse<ChatGroup>>> getOrCreatePrivateChat(
            @Valid @RequestBody PrivateChatRequest request) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(memberAId -> chatService.getOrCreatePrivateChat(memberAId, request.targetMemberId()))
                .map(group -> ResponseEntity
                        .status(HttpStatus.CREATED)
                        .body(new ApiResponse<>("Private chat retrieved or created successfully", group)));
    }

    /**
     * 3. Get message history of a group (simple pagination).
     */
    @GetMapping("/groups/{groupId}/messages")
    public Mono<ResponseEntity<ApiResponse<List<ChatMessage>>>> getMessages(
            @PathVariable("groupId") @Min(1) Long groupId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return chatService.getMessages(groupId, page, size)
                .collectList()
                .map(messages -> ResponseEntity
                        .ok(new ApiResponse<>("Messages retrieved successfully", messages)));
    }
}

