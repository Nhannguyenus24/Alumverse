package com.service.backend.admin.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * A single admin audit entry flattened with the acting admin's identity joined in,
 * so the dashboard can render "who did what" without a second lookup.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminAuditLogResponse {
    private Long id;

    private Integer adminUserId;
    private String adminFullName;
    private String adminEmail;
    private String adminRole;

    private Integer targetUserId;

    private String action;
    private String resourceType;
    private String resourceId;

    private String beforeData;
    private String afterData;
    private String metadata;

    private String httpMethod;
    private String requestPath;
    private String ipAddress;
    private String userAgent;
    private Integer statusCode;
    private Long latencyMs;
    private String status;

    private LocalDateTime createdAt;
}
