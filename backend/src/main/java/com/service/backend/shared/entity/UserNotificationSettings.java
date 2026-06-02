package com.service.backend.shared.entity;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("user_notification_settings")
public class UserNotificationSettings {

    @Id
    @Column("user_id")
    private Integer userId;

    @Column("email_enabled")
    private Boolean emailEnabled;

    @Column("push_enabled")
    private Boolean pushEnabled;

    @Column("event_reminder_enabled")
    private Boolean eventReminderEnabled;

    @Column("news_enabled")
    private Boolean newsEnabled;

    @Column("forum_reply_enabled")
    private Boolean forumReplyEnabled;

    @LastModifiedDate
    @Column("updated_at")
    private LocalDateTime updatedAt;
}
