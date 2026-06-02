package com.service.backend.chat.controller;

import com.service.backend.chat.dto.ConversationRequestConnectionStatusResponse;
import com.service.backend.chat.dto.ConversationRequestSearchItemResponse;
import com.service.backend.chat.dto.CreateConversationRequestBody;
import com.service.backend.chat.dto.RespondConversationRequestBody;
import com.service.backend.chat.dto.RespondConversationRequestResponse;
import com.service.backend.chat.service.ChatConversationRequestService;
import com.service.backend.shared.dto.ApiResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.enums.ConversationRequestStatus;
import com.service.backend.shared.utils.SecurityUtils;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/chat/conversation-requests")
@Validated
@RequiredArgsConstructor
public class ChatConversationRequestController {

    private final ChatConversationRequestService chatConversationRequestService;

    /**
     * Returns the conversation request status between the authenticated member and the target member.
     * When a request exists, also returns the current member's latest message in that chat group.
     * Data is null when no request record exists for the pair.
     */
    @GetMapping("/connection-status")
    public Mono<ResponseEntity<ApiResponse<ConversationRequestConnectionStatusResponse>>> checkConnectionStatus(
            @RequestParam("targetMemberId") @Min(1) Long targetMemberId) {

        return SecurityUtils.getCurrentUserId()
                .flatMap(currentMemberId -> chatConversationRequestService
                        .getConnectionStatus(currentMemberId, targetMemberId)
                        .map(result -> ResponseEntity.ok(
                                new ApiResponse<>("Conversation request status retrieved successfully", result)))
                        .switchIfEmpty(Mono.just(ResponseEntity.ok(
                                new ApiResponse<>("Conversation request status retrieved successfully", null)))));
    }

    /**
     * Search incoming conversation requests for the authenticated user.
     * Filters by requester's full name (partial, case-insensitive) and/or request status.
     */
    @GetMapping("/search")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<ConversationRequestSearchItemResponse>>>> searchIncomingRequests(
            @RequestParam(required = false) String fullName,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int size) {

        return SecurityUtils.getCurrentUserId()
                .flatMap(currentUserId -> chatConversationRequestService
                        .searchIncomingRequests(currentUserId, fullName, status, page, size))
                .map(result -> ResponseEntity.ok(
                        new ApiResponse<>("Incoming conversation requests retrieved successfully", result)));
    }

    /**
     * Creates a new conversation request from the authenticated member to the target member.
     * Allocates a private chat group, saves the initial message, and records the request
     * with status PENDING (cooldown is applied only after rejection).
     */
    @PostMapping
    public Mono<ResponseEntity<ApiResponse<Long>>> createConversationRequest(
            @RequestBody @Valid CreateConversationRequestBody body) {

        return SecurityUtils.getCurrentUserId()
                .flatMap(currentMemberId -> chatConversationRequestService
                        .createConversationRequest(currentMemberId, body.getTargetMemberId(), body.getMessage()))
                .map(requestId -> ResponseEntity
                        .status(HttpStatus.CREATED)
                        .body(new ApiResponse<>("Conversation request created successfully", requestId)));
    }

    /**
     * Accepts or rejects an incoming conversation request.
     * Only the target member ({@code target_member_id}) may respond.
     */
    @PutMapping("/respond")
    public Mono<ResponseEntity<ApiResponse<RespondConversationRequestResponse>>> respondToConversationRequest(
            @RequestBody @Valid RespondConversationRequestBody body) {

        ConversationRequestStatus requestedStatus = ConversationRequestStatus.valueOf(body.getStatus());

        return SecurityUtils.getCurrentUserId()
                .flatMap(currentMemberId -> chatConversationRequestService.respondToConversationRequest(
                        currentMemberId, body.getId(), requestedStatus))
                .map(result -> ResponseEntity.ok(
                        new ApiResponse<>("Conversation request responded successfully", result)));
    }
}
