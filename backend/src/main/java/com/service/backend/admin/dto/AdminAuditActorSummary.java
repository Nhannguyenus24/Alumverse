package com.service.backend.admin.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Aggregated activity of a single admin account: how many actions they performed,
 * when they were last active, and how many of those failed. Powers the per-admin
 * overview and the admin filter dropdown.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminAuditActorSummary {
    private Integer adminUserId;
    private String adminFullName;
    private String adminEmail;
    private String adminRole;
    private Long totalActions;
    private Long failedActions;
    private LocalDateTime lastActionAt;
}
