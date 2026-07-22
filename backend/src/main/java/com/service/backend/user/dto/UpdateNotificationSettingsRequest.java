package com.service.backend.user.dto;

import lombok.Data;

@Data
public class UpdateNotificationSettingsRequest {
    private Boolean emailEnabled;
    private Boolean pushEnabled;
    private Boolean eventReminderEnabled;
    private Boolean newsEnabled;
    private Boolean forumReplyEnabled;
}
