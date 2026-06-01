package com.service.backend.chat.controller;

import com.service.backend.chat.dto.RecentChatPreviewResponse;
import com.service.backend.chat.service.ChatRecentPreviewService;
import com.service.backend.shared.dto.ApiResponse;
import com.service.backend.shared.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.List;

@RestController
@RequestMapping("/api/chat/recent-previews")
@RequiredArgsConstructor
public class ChatRecentPreviewController {

    private final ChatRecentPreviewService chatRecentPreviewService;

    /**
     * Returns the top 5 most recent chat groups (PRIVATE or GROUP) for the authenticated user.
     * Each item includes the peer's name, avatar, last message preview, and its timestamp.
     */
    @GetMapping
    public Mono<ResponseEntity<ApiResponse<List<RecentChatPreviewResponse>>>> getTop5RecentChatPreviews() {
        return SecurityUtils.getCurrentUserId()
                .flatMap(memberId -> chatRecentPreviewService
                        .getTop5RecentChatPreviews(memberId)
                        .collectList())
                .map(previews -> ResponseEntity.ok(
                        new ApiResponse<>("Recent chat previews retrieved successfully", previews)));
    }
}
