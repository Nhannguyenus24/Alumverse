package com.service.backend.admin.dto;

import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record FitBotKnowledgeResponse(
        Long id,
        String sourceName,
        String title,
        String content,
        Boolean enabled,
        String syncStatus,
        String syncError,
        LocalDateTime lastSyncedAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
