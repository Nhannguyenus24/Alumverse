package com.service.backend.chat.dto;

import java.time.LocalDateTime;

public record ChatMessageResponse(
        Long id,
        Long groupId,
        Long senderMemberId,
        String senderFullName,
        String senderAvatarUrl,
        String content,
        String messageType,
        String metadata,
        LocalDateTime createdAt,
        LocalDateTime editedAt,
        LocalDateTime deletedAt
) {
}
