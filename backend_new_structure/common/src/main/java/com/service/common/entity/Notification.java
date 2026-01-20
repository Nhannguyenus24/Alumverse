package com.service.common.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("notifications")
public class Notification {

    @Id
    private Long id;

    @Column("member_id")
    private Long memberId;

    private String title;

    private String message;

    @Column("target_url")
    private String targetUrl;

    @Column("is_read")
    private Boolean isRead;

    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;
}
