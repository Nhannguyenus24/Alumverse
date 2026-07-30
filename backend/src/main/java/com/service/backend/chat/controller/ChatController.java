package com.service.backend.chat.controller;

import com.service.backend.chat.dto.AddMembersRequest;
import com.service.backend.chat.dto.ChatGroupMemberItemResponse;
import com.service.backend.chat.dto.ChatGroupMetadataResponse;
import com.service.backend.chat.dto.ChatMessageResponse;
import com.service.backend.chat.dto.CreateGroupRequest;
import com.service.backend.chat.dto.GroupBlockedMembersContextResponse;
import com.service.backend.chat.dto.GroupChatListItemResponse;
import com.service.backend.chat.dto.PeerActiveStatusResponse;
import com.service.backend.chat.dto.PrivateChatListItemResponse;
import com.service.backend.chat.dto.PrivateChatRequest;
import com.service.backend.chat.dto.UpdateGroupAvatarRequest;
import com.service.backend.chat.dto.UpdateGroupRequest;
import com.service.backend.shared.entity.ChatGroup;
import com.service.backend.chat.service.ChatService;
import com.service.backend.chat.service.UserBlockService;
import com.service.backend.shared.dto.ApiResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
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
import reactor.core.publisher.Mono;

import java.util.List;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Chat > General", description = "API endpoints for real-time messaging and general chat")
@RestController
@RequestMapping("/api/chat")
@Validated
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final UserBlockService userBlockService;

    /*
        Search group chats of the current user.
        text: filter by group title (case-insensitive, optional)
        page/size: pagination, default page=0, size=5
    */
    @GetMapping("/groups")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<GroupChatListItemResponse>>>> listChatGroups(
            @RequestParam(required = false, defaultValue = "") String text,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(memberId -> this.chatService.getListGroupChatsWithSummary(memberId, text, page, size))
                .map(result -> ResponseEntity
                        .ok(new ApiResponse<>("Chat groups retrieved successfully", result)));
    }

    /*
        Search private chats of the current user.
        text: filter by peer name (case-insensitive, optional)
        page/size: pagination, default page=0, size=5
    */
    @GetMapping("/private/list")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<PrivateChatListItemResponse>>>> listPrivateChats(
            @RequestParam(required = false, defaultValue = "") String text,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(memberId -> this.chatService.getListPrivateChatsWithSummary(memberId, text, page, size))
                .map(result -> ResponseEntity
                        .ok(new ApiResponse<>("Private chats retrieved successfully", result)));
    }


    /*
        Total unread messages for the current user across all chats. Used to seed the global
        message badge on initial page load; afterwards the badge is kept live by SSE, so the
        client should not poll this endpoint.
    */
    @GetMapping("/unread-count")
    public Mono<ResponseEntity<ApiResponse<Long>>> getUnreadCount() {
        return SecurityUtils.getCurrentUserId()
                .flatMap(this.chatService::getUnreadCount)
                .map(count -> ResponseEntity
                        .ok(new ApiResponse<>("Unread count retrieved successfully", count)));
    }

    /*
        Get whether the peer of a private chat is still eligible to receive messages
        (account status ACTIVE or UNVERIFIED). Used by the chat UI, right when a private
        chat is opened, to warn the user and disable the composer if the peer's account
        has since been suspended, banned, disabled or deleted.
    */
    @GetMapping("/private/{peerMemberId}/status")
    public Mono<ResponseEntity<ApiResponse<PeerActiveStatusResponse>>> getPeerActiveStatus(
            @PathVariable("peerMemberId") @Min(1) Long peerMemberId) {
        return SecurityUtils.getCurrentUserId()
                .then(userBlockService.getPeerActiveStatus(peerMemberId))
                .map(result -> ResponseEntity
                        .ok(new ApiResponse<>("Peer active status retrieved successfully", result)));
    }

    /*
        Get chat information (not message) from member A and member B
    */
    @GetMapping("/private")
    public Mono<ResponseEntity<ApiResponse<ChatGroup>>> getPrivateChat(
            @RequestParam("targetMemberId") @Min(1) Long targetMemberId) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(memberAId -> this.chatService.getPrivateChat(memberAId, targetMemberId))
                .map(group -> ResponseEntity
                        .ok(new ApiResponse<>("Private chat retrieved successfully", group)));
    }

    /*
        Create a private chat between memberA and memberB
    */
    @PostMapping("/private/create")
    public Mono<ResponseEntity<ApiResponse<ChatGroup>>> createPrivateChat(
            @Valid @RequestBody PrivateChatRequest request) {
        return Mono.error(new ApplicationException(
                ErrorCode.FORBIDDEN,
                "Private chat must be created through a conversation request and accepted by the target member"));
    }

    /*
        Get messages of a group ID, with pagination 
    */
    @GetMapping("/groups/{groupId}/messages")
    public Mono<ResponseEntity<ApiResponse<List<ChatMessageResponse>>>> getMessages(
            @PathVariable("groupId") @Min(1) Long groupId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(memberId -> this.chatService.getMessagesWithSenderInfo(groupId, memberId, page, size)
                        .collectList())
                .map(messages -> ResponseEntity
                        .ok(new ApiResponse<>("Messages retrieved successfully", messages)));
    }


    /*
        Mark a chat group as read for the current user. Stamps last_read_at = now so the
        conversation's unread count drops to 0 on the next list fetch, and notifies the
        user's other open tabs via SSE (chat-read) to clear the unread marker in real time.
    */
    @PostMapping("/groups/{groupId}/read")
    public Mono<ResponseEntity<ApiResponse<Void>>> markGroupAsRead(
            @PathVariable("groupId") @Min(1) Long groupId) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(memberId -> this.chatService.markGroupAsRead(groupId, memberId))
                .thenReturn(ResponseEntity
                        .ok(new ApiResponse<>("Chat group marked as read", null)));
    }


    /*
        Create a group chat with a list of member IDs
    */
    @PostMapping("/groups")
    public Mono<ResponseEntity<ApiResponse<ChatGroup>>> createGroupChat(
            @Valid @RequestBody CreateGroupRequest request) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(currentMemberId -> this.chatService.createGroupChat(currentMemberId, request.getTitle(), request.getMemberIds()))
                .map(group -> ResponseEntity
                        .status(HttpStatus.CREATED)
                        .body(new ApiResponse<>("Group chat created successfully", group)));
    }


    /*
        Add a list of member IDs to the group id in path
    */
    @PostMapping("/groups/{groupId}/members")
    public Mono<ResponseEntity<ApiResponse<Void>>> addMembersToGroup(
            @PathVariable("groupId") @Min(1) Long groupId,
            @Valid @RequestBody AddMembersRequest request) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(currentMemberId -> this.chatService.addMembersToGroup(groupId, currentMemberId, request.getMemberIds()))
                .thenReturn(ResponseEntity
                        .ok(new ApiResponse<>("Members added successfully", null)));
    }


    /*
        Remove one member ID from one group ID
    */
    @DeleteMapping("/groups/{groupId}/members/{memberId}")
    public Mono<ResponseEntity<ApiResponse<Void>>> removeMemberFromGroup(
            @PathVariable("groupId") @Min(1) Long groupId,
            @PathVariable("memberId") @Min(1) Long memberId) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(currentMemberId -> this.chatService.removeMemberFromGroup(groupId, currentMemberId, memberId))
                .thenReturn(ResponseEntity
                        .ok(new ApiResponse<>("Member removed successfully", null)));
    }


    /*
        Get all members of a group ID with profile info.
        Only group members can access this endpoint.
    */
    @GetMapping("/groups/{groupId}/members")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<ChatGroupMemberItemResponse>>>> getGroupMembers(
            @PathVariable("groupId") @Min(1) Long groupId,
            @RequestParam(required = false, defaultValue = "") String text,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(currentMemberId ->
                        this.chatService.getGroupMembersWithProfile(groupId, currentMemberId, text, page, size))
                .map(result -> ResponseEntity
                        .ok(new ApiResponse<>("Group members retrieved successfully", result)));
    }

    /*
        Get members blocked by the current user who are still in this group chat.
        Used by the group chat UI to show an informational banner.
    */
    @GetMapping("/groups/{groupId}/blocked-members-context")
    public Mono<ResponseEntity<ApiResponse<GroupBlockedMembersContextResponse>>> getGroupBlockedMembersContext(
            @PathVariable("groupId") @Min(1) Long groupId) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(currentMemberId -> this.chatService.getGroupBlockedMembersContext(currentMemberId, groupId))
                .map(result -> ResponseEntity
                        .ok(new ApiResponse<>("Group blocked members context retrieved successfully", result)));
    }

    /*
        Get info of a chat group 
    */
    @GetMapping("/groups/{groupId}/info")
    public Mono<ResponseEntity<ApiResponse<ChatGroupMetadataResponse>>> getChatGroupMetadata(
            @PathVariable("groupId") @Min(1) Long groupId) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(memberId -> this.chatService.getChatGroupMetadata(groupId, memberId))
                .map(metadata -> ResponseEntity
                        .ok(new ApiResponse<>("Chat group metadata retrieved successfully", metadata)));
    }


    /*
        Update a chat group title
    */
    @PutMapping("/groups/{groupId}")
    public Mono<ResponseEntity<ApiResponse<ChatGroup>>> updateGroupInfo(
            @PathVariable("groupId") @Min(1) Long groupId,
            @Valid @RequestBody UpdateGroupRequest request) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(currentMemberId -> this.chatService.updateGroupInfo(groupId, currentMemberId, request.getTitle()))
                .map(updatedGroup -> ResponseEntity
                        .ok(new ApiResponse<>("Group updated successfully", updatedGroup)));
    }


    /*
        Update a chat group avatar (owner-only, group chats only)
    */
    @PutMapping("/groups/{groupId}/avatar")
    public Mono<ResponseEntity<ApiResponse<ChatGroup>>> updateGroupAvatar(
            @PathVariable("groupId") @Min(1) Long groupId,
            @Valid @RequestBody UpdateGroupAvatarRequest request) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(currentMemberId -> this.chatService.updateGroupAvatar(groupId, currentMemberId, request.getAvatarUrl()))
                .map(updatedGroup -> ResponseEntity
                        .ok(new ApiResponse<>("Group avatar updated successfully", updatedGroup)));
    }


    /*
        You get out of the group ID
    */
    @DeleteMapping("/groups/{groupId}/leave")
    public Mono<ResponseEntity<ApiResponse<Void>>> leaveGroup(
            @PathVariable("groupId") @Min(1) Long groupId) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(currentMemberId -> this.chatService.leaveGroup(groupId, currentMemberId))
                .thenReturn(ResponseEntity
                        .ok(new ApiResponse<>("Left group successfully", null)));
    }


    /*
        Delete a group, all chat message of the group, all member id of that chat group
    */
    @DeleteMapping("/groups/{groupId}")
    public Mono<ResponseEntity<ApiResponse<Void>>> deleteGroup(
            @PathVariable("groupId") @Min(1) Long groupId) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(currentMemberId -> this.chatService.deleteGroup(groupId, currentMemberId))
                .thenReturn(ResponseEntity
                        .ok(new ApiResponse<>("Group deleted successfully", null)));
    }
}
