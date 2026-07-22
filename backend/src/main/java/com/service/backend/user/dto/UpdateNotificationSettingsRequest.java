package com.service.backend.user.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class UpdateNotificationSettingsRequest {
    private Boolean emailEnabled;
    private Boolean pushEnabled;
    private Boolean eventReminderEnabled;
    private Boolean newsEnabled;
    private Boolean forumReplyEnabled;
}
