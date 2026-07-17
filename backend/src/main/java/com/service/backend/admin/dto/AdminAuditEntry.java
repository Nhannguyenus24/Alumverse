package com.service.backend.admin.dto;

import lombok.Builder;
import lombok.Data;

/**
 * Immutable carrier describing one admin action to be persisted. Populated either by the
 * WebFilter auto-capture layer (full request context) or by service-layer semantic logging
 * (action/resource/before-after). Any field may be null.
 */
@Data
@Builder
public class AdminAuditEntry {
    private Integer adminUserId;
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
}
