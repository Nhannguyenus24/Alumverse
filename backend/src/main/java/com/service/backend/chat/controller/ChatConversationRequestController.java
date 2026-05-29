package com.service.backend.chat.controller;

import com.service.backend.chat.service.ChatConversationRequestService;
import com.service.backend.shared.dto.ApiResponse;
import com.service.backend.shared.enums.ConversationRequestStatus;
import com.service.backend.shared.utils.SecurityUtils;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
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
     * Status is null when no request record exists for the pair.
     */
    @GetMapping("/connection-status")
    public Mono<ResponseEntity<ApiResponse<ConversationRequestStatus>>> checkConnectionStatus(
            @RequestParam("targetMemberId") @Min(1) Long targetMemberId) {

        return SecurityUtils.getCurrentUserId()
                .flatMap(currentMemberId -> chatConversationRequestService
                        .getConversationRequestStatus(currentMemberId, targetMemberId)
                        .map(status -> ResponseEntity.ok(
                                new ApiResponse<>("Conversation request status retrieved successfully", status)))
                        .switchIfEmpty(Mono.just(ResponseEntity.ok(
                                new ApiResponse<>("Conversation request status retrieved successfully", null)))));
    }
}
