package com.service.backend.user.entity;

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
@Table("notifications")
public class Notification {

    @Id
    private Integer id;

    @Column("member_id")
    private Integer memberId;

    @Column("title")
    private String title;

    @Column("message")
    private String message;

    @Column("is_read")
    private Boolean isRead;

    @Column("created_at")
    private LocalDateTime createdAt;
}
