package com.service.backend.chat.controller;

import com.service.backend.chat.dto.AddMembersRequest;
import com.service.backend.chat.dto.CreateGroupRequest;
import com.service.backend.chat.dto.PrivateChatRequest;
import com.service.backend.chat.dto.UpdateGroupRequest;
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
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
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

    @PostMapping("/private")
    public Mono<ResponseEntity<ApiResponse<ChatGroup>>> getOrCreatePrivateChat(
            @Valid @RequestBody PrivateChatRequest request) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(memberAId -> chatService.getOrCreatePrivateChat(memberAId, request.targetMemberId()))
                .map(group -> ResponseEntity
                        .status(HttpStatus.CREATED)
                        .body(new ApiResponse<>("Private chat retrieved or created successfully", group)));
    }

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


    @PostMapping("/groups")
    public Mono<ResponseEntity<ApiResponse<ChatGroup>>> createGroupChat(
            @Valid @RequestBody CreateGroupRequest request) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(currentMemberId -> chatService.createGroupChat(currentMemberId, request.memberIds()))
                .map(group -> ResponseEntity
                        .status(HttpStatus.CREATED)
                        .body(new ApiResponse<>("Group chat created successfully", group)));
    }


    @PostMapping("/groups/{groupId}/members")
    public Mono<ResponseEntity<ApiResponse<Void>>> addMembersToGroup(
            @PathVariable("groupId") @Min(1) Long groupId,
            @Valid @RequestBody AddMembersRequest request) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(currentMemberId -> chatService.addMembersToGroup(groupId, currentMemberId, request.memberIds()))
                .thenReturn(ResponseEntity
                        .ok(new ApiResponse<>("Members added successfully", null)));
    }


    @DeleteMapping("/groups/{groupId}/members/{memberId}")
    public Mono<ResponseEntity<ApiResponse<Void>>> removeMemberFromGroup(
            @PathVariable("groupId") @Min(1) Long groupId,
            @PathVariable("memberId") @Min(1) Long memberId) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(currentMemberId -> chatService.removeMemberFromGroup(groupId, currentMemberId, memberId))
                .thenReturn(ResponseEntity
                        .ok(new ApiResponse<>("Member removed successfully", null)));
    }


    @GetMapping("/groups/{groupId}/members")
    public Mono<ResponseEntity<ApiResponse<List<ChatGroupMember>>>> getGroupMembers(
            @PathVariable("groupId") @Min(1) Long groupId) {
        Flux<ChatGroupMember> membersFlux = chatService.getGroupMembers(groupId);
        return membersFlux.collectList()
                .map(members -> ResponseEntity
                        .ok(new ApiResponse<>("Group members retrieved successfully", members)));
    }


    @PutMapping("/groups/{groupId}")
    public Mono<ResponseEntity<ApiResponse<ChatGroup>>> updateGroupInfo(
            @PathVariable("groupId") @Min(1) Long groupId,
            @Valid @RequestBody UpdateGroupRequest request) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(currentMemberId -> chatService.updateGroupInfo(groupId, currentMemberId, request.title()))
                .map(updatedGroup -> ResponseEntity
                        .ok(new ApiResponse<>("Group updated successfully", updatedGroup)));
    }


    @DeleteMapping("/groups/{groupId}/leave")
    public Mono<ResponseEntity<ApiResponse<Void>>> leaveGroup(
            @PathVariable("groupId") @Min(1) Long groupId) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(currentMemberId -> chatService.leaveGroup(groupId, currentMemberId))
                .thenReturn(ResponseEntity
                        .ok(new ApiResponse<>("Left group successfully", null)));
    }


    @DeleteMapping("/groups/{groupId}")
    public Mono<ResponseEntity<ApiResponse<Void>>> deleteGroup(
            @PathVariable("groupId") @Min(1) Long groupId) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(currentMemberId -> chatService.deleteGroup(groupId, currentMemberId))
                .thenReturn(ResponseEntity
                        .ok(new ApiResponse<>("Group deleted successfully", null)));
    }
}

