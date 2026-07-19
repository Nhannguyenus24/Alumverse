package com.service.backend.admin.controller;

import com.service.backend.admin.dto.AdminAuditActorSummary;
import com.service.backend.admin.dto.AdminAuditFacets;
import com.service.backend.admin.dto.AdminAuditLogResponse;
import com.service.backend.admin.dto.LoginHistoryResponse;
import com.service.backend.admin.dto.SuspiciousLoginInfo;
import com.service.backend.admin.service.AdminAuditService;
import com.service.backend.admin.service.AuditService;
import com.service.backend.shared.dto.ApiResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import jakarta.validation.constraints.Min;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.service.backend.shared.utils.SecurityUtils;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;

@Tag(name = "Admin > Audit", description = "API endpoints for viewing system audit logs")
@RestController
@RequestMapping("/api/admin/audit")
@Validated
@PreAuthorize("hasRole('ADMIN')")
public class AuditController {

    private final AuditService auditService;
    private final AdminAuditService adminAuditService;

    public AuditController(AuditService auditService, AdminAuditService adminAuditService) {
        this.auditService = auditService;
        this.adminAuditService = adminAuditService;
    }

    /**
     * Get all login histories with pagination, optionally filtered by organization
     */
    @GetMapping("/login-history")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<LoginHistoryResponse>>>> getLoginHistories(
            @RequestParam(required = false) Integer organizationId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) int size) {
        return SecurityUtils.resolveOrganizationId(organizationId)
                .flatMap(resolvedOrgId -> auditService.getLoginHistories(resolvedOrgId, page, size))
                .switchIfEmpty(auditService.getLoginHistories(null, page, size))
                .map(data -> ResponseEntity.ok(
                        new ApiResponse<>("Login histories fetched successfully", data)));
    }

    /**
     * Get login histories for a specific user
     */
    @GetMapping("/login-history/user/{userId}")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<LoginHistoryResponse>>>> getLoginHistoriesByUser(
            @PathVariable Integer userId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) int size) {
        return auditService.getLoginHistoriesByUser(userId, page, size)
                .map(data -> ResponseEntity.ok(
                        new ApiResponse<>("Login histories fetched successfully", data)));
    }

    /**
     * Get aggregated login stats: breakdown by method and daily counts for last 30 days
     */
    @GetMapping("/login-history/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public Mono<ResponseEntity<ApiResponse<Map<String, Object>>>> getLoginStats() {
        return auditService.getLoginStats()
                .map(data -> ResponseEntity.ok(
                        new ApiResponse<>("Login stats fetched successfully", data)));
    }

    /**
     * Get users with logins from more than 3 distinct IPs in the last 7 days
     */
    @GetMapping("/login-history/suspicious")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public Mono<ResponseEntity<ApiResponse<List<SuspiciousLoginInfo>>>> getSuspiciousLogins() {
        return auditService.getSuspiciousLogins()
                .map(data -> ResponseEntity.ok(
                        new ApiResponse<>("Suspicious logins fetched successfully", data)));
    }

    // ------------------------------------------------------------------ admin actions

    /**
     * Paginated, filtered view of what each admin account did on the dashboard. ADMIN sees
     * all organizations (or a specific one via organizationId); STAFF is scoped to their org.
     */
    @GetMapping("/actions")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<AdminAuditLogResponse>>>> getAdminActions(
            @RequestParam(required = false) Integer organizationId,
            @RequestParam(required = false) Integer adminUserId,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String resourceType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) int size) {
        return SecurityUtils.resolveOrganizationId(organizationId)
                .flatMap(resolvedOrgId -> adminAuditService.search(resolvedOrgId, adminUserId, action, resourceType, status, from, to, q, page, size))
                .switchIfEmpty(adminAuditService.search(null, adminUserId, action, resourceType, status, from, to, q, page, size))
                .map(data -> ResponseEntity.ok(
                        new ApiResponse<>("Admin actions fetched successfully", data)));
    }

    /**
     * Filter facets: the distinct actions, resource types, and admins that actually appear
     * in the log — used to populate the dashboard filter dropdowns.
     */
    @GetMapping("/actions/facets")
    public Mono<ResponseEntity<ApiResponse<AdminAuditFacets>>> getAdminActionFacets(
            @RequestParam(required = false) Integer organizationId) {
        return SecurityUtils.resolveOrganizationId(organizationId)
                .flatMap(adminAuditService::getFacets)
                .switchIfEmpty(adminAuditService.getFacets(null))
                .map(data -> ResponseEntity.ok(
                        new ApiResponse<>("Admin action facets fetched successfully", data)));
    }

    /**
     * Per-admin activity roll-up over an optional time window: total actions, failures, and
     * last-active time for each admin account.
     */
    @GetMapping("/actions/summary")
    public Mono<ResponseEntity<ApiResponse<List<AdminAuditActorSummary>>>> getAdminActionSummary(
            @RequestParam(required = false) Integer organizationId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        return SecurityUtils.resolveOrganizationId(organizationId)
                .flatMap(resolvedOrgId -> adminAuditService.getSummary(resolvedOrgId, from, to))
                .switchIfEmpty(adminAuditService.getSummary(null, from, to))
                .map(data -> ResponseEntity.ok(
                        new ApiResponse<>("Admin action summary fetched successfully", data)));
    }

    /**
     * Export the filtered audit log as CSV (capped at 10,000 rows).
     */
    @GetMapping(value = "/actions/export", produces = "text/csv")
    public Mono<ResponseEntity<String>> exportAdminActions(
            @RequestParam(required = false) Integer organizationId,
            @RequestParam(required = false) Integer adminUserId,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String resourceType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(required = false) String q) {
        int limit = 10_000;
        return SecurityUtils.resolveOrganizationId(organizationId)
                .flatMap(resolvedOrgId -> adminAuditService
                        .exportStream(resolvedOrgId, adminUserId, action, resourceType, status, from, to, q, limit)
                        .collectList())
                .switchIfEmpty(Mono.defer(() -> adminAuditService
                        .exportStream(null, adminUserId, action, resourceType, status, from, to, q, limit)
                        .collectList()))
                .map(rows -> ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"admin-audit-log.csv\"")
                        .contentType(MediaType.parseMediaType("text/csv"))
                        .body(toCsv(rows)));
    }

    private static final String[] CSV_HEADERS = {
            "id", "createdAt", "adminUserId", "adminFullName", "adminEmail", "adminRole",
            "action", "resourceType", "resourceId", "targetUserId",
            "httpMethod", "requestPath", "statusCode", "status", "latencyMs", "ipAddress", "userAgent"
    };

    private String toCsv(List<AdminAuditLogResponse> rows) {
        StringBuilder sb = new StringBuilder();
        sb.append(String.join(",", CSV_HEADERS)).append("\r\n");
        for (AdminAuditLogResponse r : rows) {
            sb.append(csv(r.getId()))
              .append(',').append(csv(r.getCreatedAt()))
              .append(',').append(csv(r.getAdminUserId()))
              .append(',').append(csv(r.getAdminFullName()))
              .append(',').append(csv(r.getAdminEmail()))
              .append(',').append(csv(r.getAdminRole()))
              .append(',').append(csv(r.getAction()))
              .append(',').append(csv(r.getResourceType()))
              .append(',').append(csv(r.getResourceId()))
              .append(',').append(csv(r.getTargetUserId()))
              .append(',').append(csv(r.getHttpMethod()))
              .append(',').append(csv(r.getRequestPath()))
              .append(',').append(csv(r.getStatusCode()))
              .append(',').append(csv(r.getStatus()))
              .append(',').append(csv(r.getLatencyMs()))
              .append(',').append(csv(r.getIpAddress()))
              .append(',').append(csv(r.getUserAgent()))
              .append("\r\n");
        }
        return sb.toString();
    }

    private String csv(Object value) {
        if (value == null) {
            return "";
        }
        String s = value.toString();
        if (s.contains(",") || s.contains("\"") || s.contains("\n") || s.contains("\r")) {
            return "\"" + s.replace("\"", "\"\"") + "\"";
        }
        return s;
    }
}
