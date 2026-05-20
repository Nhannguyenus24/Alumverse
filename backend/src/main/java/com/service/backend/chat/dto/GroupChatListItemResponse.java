package com.service.backend.chat.dto;

import java.time.LocalDateTime;

public record GroupChatListItemResponse(
        Long id,
        String type,
        String title,
        Long createdBy,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        Long memberCount,
        String lastMessagePreview,
        LocalDateTime lastMessageAt
) {
}
