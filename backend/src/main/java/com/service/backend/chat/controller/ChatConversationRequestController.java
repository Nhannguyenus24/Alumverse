package com.service.backend.chat.controller;

import com.service.backend.chat.service.ChatConversationRequestService;
import com.service.backend.shared.dto.ApiResponse;
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
     * Check whether the authenticated member and the target member share a chat group.
     *
     * @param targetMemberId the other member to compare against
     * @return true when both members have a chat_group_members row with the same group_id
     */
    @GetMapping("/connection-status")
    public Mono<ResponseEntity<ApiResponse<Boolean>>> checkConnectionStatus(
            @RequestParam("targetMemberId") @Min(1) Long targetMemberId) {

        return SecurityUtils.getCurrentUserId()
                .flatMap(currentMemberId -> chatConversationRequestService
                        .areMembersInSameGroup(currentMemberId, targetMemberId))
                .map(connected -> ResponseEntity.ok(
                        new ApiResponse<>("Connection status retrieved successfully", connected)));
    }
}
