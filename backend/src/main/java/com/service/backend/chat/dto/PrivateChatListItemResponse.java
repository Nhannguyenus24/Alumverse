package com.service.backend.chat.dto;

import java.time.LocalDateTime;

public record PrivateChatListItemResponse(
        Long id,
        String type,
        String title,
        Long createdBy,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        Long peerMemberId,
        String peerUserName,
        String peerAvatarUrl,
        String lastMessagePreview,
        LocalDateTime lastMessageAt
) {
}
