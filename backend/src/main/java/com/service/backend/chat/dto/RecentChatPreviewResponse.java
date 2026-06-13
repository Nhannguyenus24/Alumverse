package com.service.backend.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecentChatPreviewResponse {

    private Long id;
    private String name;
    private String avatarUrl;
    private String preview;
    private LocalDateTime updatedAt;
    private String type;
}
