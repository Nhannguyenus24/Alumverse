package com.service.backend.admin.service;

import java.time.LocalDateTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.service.backend.admin.dao.AdminAuditLogRepository;
import com.service.backend.admin.dto.AdminAuditActorSummary;
import com.service.backend.admin.dto.AdminAuditEntry;
import com.service.backend.admin.dto.AdminAuditFacets;
import com.service.backend.admin.dto.AdminAuditLogResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.utils.PaginationHelper;

import reactor.core.publisher.Mono;

/**
 * Central home for the admin audit trail — both writing entries and reading them back.
 *
 * <p>Writing has two entry points that funnel into a single persistence path:
 * <ul>
 *   <li>{@link #record(AdminAuditEntry)} — the WebFilter auto-capture layer records every
 *       mutating {@code /api/admin/**} request here.</li>
 *   <li>{@link #recordSemantic} — service code records rich "who did what to whom" entries
 *       (bans, deletes, moderation) with before/after snapshots.</li>
 * </ul>
 * Both are best-effort: an audit failure never propagates to the business operation.
 */
@Service
public class AdminAuditService {

    private static final Logger logger = LoggerFactory.getLogger(AdminAuditService.class);

    public static final String STATUS_SUCCESS = "SUCCESS";
    public static final String STATUS_FAILURE = "FAILURE";

    private final AdminAuditLogRepository repository;

    public AdminAuditService(AdminAuditLogRepository repository) {
        this.repository = repository;
    }

    // ------------------------------------------------------------------ write

    /**
     * Persist a fully-formed audit entry. Falls back to the pre-enrichment insert if the
     * enriched columns are unavailable (e.g. migration not yet applied), then swallows any
     * remaining error so auditing can never break the request it is describing.
     */
    public Mono<Void> record(AdminAuditEntry entry) {
        if (entry == null || entry.getAdminUserId() == null) {
            return Mono.empty();
        }
        String action = entry.getAction() != null ? entry.getAction() : "UNKNOWN";
        String resourceType = entry.getResourceType() != null ? entry.getResourceType() : "UNKNOWN";
        return repository.insertEnrichedAuditLog(
                        entry.getAdminUserId(),
                        entry.getAdminRole(),
                        entry.getTargetUserId(),
                        action,
                        resourceType,
                        entry.getResourceId(),
                        entry.getBeforeData(),
                        entry.getAfterData(),
                        entry.getMetadata(),
                        entry.getHttpMethod(),
                        entry.getRequestPath(),
                        entry.getIpAddress(),
                        entry.getUserAgent(),
                        entry.getStatusCode(),
                        entry.getLatencyMs(),
                        entry.getStatus())
                .onErrorResume(enrichedErr -> {
                    logger.warn("Enriched audit insert failed, retrying basic insert for action {}", action, enrichedErr);
                    return repository.insertAuditLog(
                            entry.getAdminUserId(),
                            entry.getTargetUserId(),
                            action,
                            resourceType,
                            entry.getResourceId(),
                            entry.getBeforeData(),
                            entry.getAfterData(),
                            entry.getMetadata());
                })
                .onErrorResume(fallbackErr -> {
                    logger.warn("All audit insert attempts failed for action {}", action, fallbackErr);
                    return Mono.empty();
                })
                .then();
    }

    /**
     * Convenience for service-layer semantic logging where the acting admin id is already
     * known (passed down from the controller). No HTTP request context is attached — the
     * WebFilter records that separately for the same request.
     */
    public Mono<Void> recordSemantic(
            Integer adminUserId,
            Integer targetUserId,
            String action,
            String resourceType,
            String resourceId,
            String beforeData,
            String afterData,
            String metadata) {
        if (adminUserId == null) {
            return Mono.empty();
        }
        return record(AdminAuditEntry.builder()
                .adminUserId(adminUserId)
                .targetUserId(targetUserId)
                .action(action)
                .resourceType(resourceType)
                .resourceId(resourceId)
                .beforeData(beforeData)
                .afterData(afterData)
                .metadata(metadata)
                .status(STATUS_SUCCESS)
                .build());
    }

    // ------------------------------------------------------------------- read

    /**
     * Paginated, filtered audit search. {@code organizationId == null} means "all orgs"
     * (ADMIN); STAFF callers pass their own org and see only actions by admins in that org.
     */
    public Mono<PaginatedResponse<AdminAuditLogResponse>> search(
            Integer organizationId,
            Integer adminUserId,
            String action,
            String resourceType,
            String status,
            LocalDateTime fromDate,
            LocalDateTime toDate,
            String query,
            int page,
            int size) {
        int offset = page * size;
        String q = normalizeQuery(query);
        return PaginationHelper.paginate(
                repository.searchAuditLogs(organizationId, adminUserId, action, resourceType, status,
                        fromDate, toDate, q, size, offset).collectList(),
                repository.countAuditLogs(organizationId, adminUserId, action, resourceType, status,
                        fromDate, toDate, q),
                page,
                size)
                .doOnError(e -> logger.error("Error searching admin audit logs: {}", e.getMessage()));
    }

    /** Distinct actions/resources actually present plus the roster of admins with activity. */
    public Mono<AdminAuditFacets> getFacets(Integer organizationId) {
        return Mono.zip(
                repository.findDistinctActions(organizationId).collectList(),
                repository.findDistinctResourceTypes(organizationId).collectList(),
                repository.summarizeByAdmin(organizationId, null, null).collectList())
                .map(t -> AdminAuditFacets.builder()
                        .actions(t.getT1())
                        .resourceTypes(t.getT2())
                        .admins(t.getT3())
                        .build())
                .doOnError(e -> logger.error("Error fetching audit facets: {}", e.getMessage()));
    }

    /** Per-admin activity roll-up over an optional time window. */
    public Mono<List<AdminAuditActorSummary>> getSummary(Integer organizationId, LocalDateTime fromDate, LocalDateTime toDate) {
        return repository.summarizeByAdmin(organizationId, fromDate, toDate)
                .collectList()
                .doOnError(e -> logger.error("Error fetching audit summary: {}", e.getMessage()));
    }

    /** Stream of all matching rows (unpaginated) for CSV export. */
    public reactor.core.publisher.Flux<AdminAuditLogResponse> exportStream(
            Integer organizationId,
            Integer adminUserId,
            String action,
            String resourceType,
            String status,
            LocalDateTime fromDate,
            LocalDateTime toDate,
            String query,
            int limit) {
        return repository.searchAuditLogs(organizationId, adminUserId, action, resourceType, status,
                fromDate, toDate, normalizeQuery(query), limit, 0);
    }

    private String normalizeQuery(String query) {
        if (query == null || query.isBlank()) {
            return null;
        }
        return "%" + query.trim() + "%";
    }
}
