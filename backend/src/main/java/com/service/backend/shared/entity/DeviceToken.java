package com.service.backend.shared.entity;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
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
@Table("device_tokens")
public class DeviceToken {

    @Id
    private Integer id;

    @Column("user_id")
    private Integer userId;

    @Column("fcm_token")
    private String fcmToken;

    @Column("platform")
    private String platform;

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("updated_at")
    private LocalDateTime updatedAt;
}
