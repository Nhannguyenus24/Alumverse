package com.service.backend.shared.entity;

import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table("admin_audit_logs")
public class AdminAuditLog {
    @Id
    private Long id;

    @Column("admin_user_id")
    private Integer adminUserId;

    @Column("target_user_id")
    private Integer targetUserId;

    private String action;

    @Column("resource_type")
    private String resourceType;

    @Column("resource_id")
    private String resourceId;

    @Column("before_data")
    private String beforeData;

    @Column("after_data")
    private String afterData;

    private String metadata;

    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;
}
