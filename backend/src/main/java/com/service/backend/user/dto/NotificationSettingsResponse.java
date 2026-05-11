package com.service.backend.user.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationSettingsResponse {
    private Integer userId;
    private Boolean emailEnabled;
    private Boolean pushEnabled;
    private Boolean eventReminderEnabled;
    private Boolean newsEnabled;
    private Boolean forumReplyEnabled;
    private LocalDateTime updatedAt;
}
