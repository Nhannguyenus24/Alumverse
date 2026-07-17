package com.service.backend.admin.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * The set of values available to filter the audit log by, computed from the data that
 * actually exists — so the frontend dropdowns never show empty/irrelevant options.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminAuditFacets {
    private List<String> actions;
    private List<String> resourceTypes;
    private List<AdminAuditActorSummary> admins;
}
