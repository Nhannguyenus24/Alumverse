package com.service.backend.admin.dao;

import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.service.backend.admin.dto.AdminAuditActorSummary;
import com.service.backend.admin.dto.AdminAuditLogResponse;
import com.service.backend.shared.entity.AdminAuditLog;

import java.time.LocalDateTime;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface AdminAuditLogRepository extends R2dbcRepository<AdminAuditLog, Long> {
    @Modifying
    @Query("""
            INSERT INTO admin_audit_logs
                (admin_user_id, target_user_id, action, resource_type, resource_id, before_data, after_data, metadata, created_at)
            VALUES
                (
                    :adminUserId,
                    :targetUserId,
                    :action,
                    :resourceType,
                    :resourceId,
                    CASE WHEN :beforeData IS NULL THEN NULL ELSE to_jsonb(CAST(:beforeData AS text)) END,
                    CASE WHEN :afterData IS NULL THEN NULL ELSE to_jsonb(CAST(:afterData AS text)) END,
                    CASE WHEN :metadata IS NULL THEN NULL ELSE to_jsonb(CAST(:metadata AS text)) END,
                    CURRENT_TIMESTAMP
                )
            """)
    Mono<Integer> insertAuditLog(
            @Param("adminUserId") Integer adminUserId,
            @Param("targetUserId") Integer targetUserId,
            @Param("action") String action,
            @Param("resourceType") String resourceType,
            @Param("resourceId") String resourceId,
            @Param("beforeData") String beforeData,
            @Param("afterData") String afterData,
            @Param("metadata") String metadata);

    /**
     * Enriched insert used by both the WebFilter auto-capture layer and the central
     * AdminAuditService. Carries the full request context (method/path/ip/ua/status/latency).
     */
    @Modifying
    @Query("""
            INSERT INTO admin_audit_logs
                (admin_user_id, admin_role, target_user_id, action, resource_type, resource_id,
                 before_data, after_data, metadata,
                 http_method, request_path, ip_address, user_agent, status_code, latency_ms, status, created_at)
            VALUES
                (
                    :adminUserId,
                    :adminRole,
                    :targetUserId,
                    :action,
                    :resourceType,
                    :resourceId,
                    CASE WHEN :beforeData IS NULL THEN NULL ELSE to_jsonb(CAST(:beforeData AS text)) END,
                    CASE WHEN :afterData IS NULL THEN NULL ELSE to_jsonb(CAST(:afterData AS text)) END,
                    CASE WHEN :metadata IS NULL THEN NULL ELSE to_jsonb(CAST(:metadata AS text)) END,
                    :httpMethod,
                    :requestPath,
                    :ipAddress,
                    :userAgent,
                    :statusCode,
                    :latencyMs,
                    :status,
                    CURRENT_TIMESTAMP
                )
            """)
    Mono<Integer> insertEnrichedAuditLog(
            @Param("adminUserId") Integer adminUserId,
            @Param("adminRole") String adminRole,
            @Param("targetUserId") Integer targetUserId,
            @Param("action") String action,
            @Param("resourceType") String resourceType,
            @Param("resourceId") String resourceId,
            @Param("beforeData") String beforeData,
            @Param("afterData") String afterData,
            @Param("metadata") String metadata,
            @Param("httpMethod") String httpMethod,
            @Param("requestPath") String requestPath,
            @Param("ipAddress") String ipAddress,
            @Param("userAgent") String userAgent,
            @Param("statusCode") Integer statusCode,
            @Param("latencyMs") Long latencyMs,
            @Param("status") String status);

    @Modifying
    @Query("""
            INSERT INTO admin_audit_logs
                (admin_user_id, target_user_id, action, created_at)
            VALUES
                (:adminUserId, :targetUserId, :action, CURRENT_TIMESTAMP)
            """)
    Mono<Integer> insertAuditLogLegacy(
            @Param("adminUserId") Integer adminUserId,
            @Param("targetUserId") Integer targetUserId,
            @Param("action") String action);

    @Query("SELECT * FROM admin_audit_logs WHERE target_user_id = :userId ORDER BY created_at DESC LIMIT :limit")
    Flux<AdminAuditLog> findRecentByTargetUserId(@Param("userId") Integer userId, @Param("limit") int limit);

    @Query("SELECT * FROM admin_audit_logs " +
           "WHERE (:adminUserId IS NULL OR admin_user_id = :adminUserId) " +
           "AND (:targetUserId IS NULL OR target_user_id = :targetUserId) " +
           "AND (:action IS NULL OR action = :action) " +
           "ORDER BY created_at DESC " +
           "LIMIT :limit OFFSET :offset")
    Flux<AdminAuditLog> findAdminActionLogs(
            @Param("adminUserId") Integer adminUserId,
            @Param("targetUserId") Integer targetUserId,
            @Param("action") String action,
            @Param("limit") int limit,
            @Param("offset") int offset);

    @Query("SELECT COUNT(*) FROM admin_audit_logs " +
           "WHERE (:adminUserId IS NULL OR admin_user_id = :adminUserId) " +
           "AND (:targetUserId IS NULL OR target_user_id = :targetUserId) " +
           "AND (:action IS NULL OR action = :action)")
    Mono<Long> countAdminActionLogs(
            @Param("adminUserId") Integer adminUserId,
            @Param("targetUserId") Integer targetUserId,
            @Param("action") String action);

    @Query("SELECT aal.* FROM admin_audit_logs aal " +
           "JOIN organization_members om ON aal.target_user_id = om.user_id " +
           "WHERE om.organization_id = :organizationId " +
           "AND (:adminUserId IS NULL OR aal.admin_user_id = :adminUserId) " +
           "AND (:targetUserId IS NULL OR aal.target_user_id = :targetUserId) " +
           "AND (:action IS NULL OR aal.action = :action) " +
           "ORDER BY aal.created_at DESC " +
           "LIMIT :limit OFFSET :offset")
    Flux<AdminAuditLog> findAdminActionLogsByOrganization(
            @Param("organizationId") Integer organizationId,
            @Param("adminUserId") Integer adminUserId,
            @Param("targetUserId") Integer targetUserId,
            @Param("action") String action,
            @Param("limit") int limit,
            @Param("offset") int offset);

    @Query("SELECT COUNT(*) FROM admin_audit_logs aal " +
           "JOIN organization_members om ON aal.target_user_id = om.user_id " +
           "WHERE om.organization_id = :organizationId " +
           "AND (:adminUserId IS NULL OR aal.admin_user_id = :adminUserId) " +
           "AND (:targetUserId IS NULL OR aal.target_user_id = :targetUserId) " +
           "AND (:action IS NULL OR aal.action = :action)")
    Mono<Long> countAdminActionLogsByOrganization(
            @Param("organizationId") Integer organizationId,
            @Param("adminUserId") Integer adminUserId,
            @Param("targetUserId") Integer targetUserId,
            @Param("action") String action);

    // ---------------------------------------------------------------------------------
    // Redesigned read side: "which admin did what". Filters are all optional; org scoping
    // is by the ACTING admin's organization (join on admin_user_id), so actions without a
    // target user no longer disappear. `organizationId = NULL` means all organizations.
    // ---------------------------------------------------------------------------------

    String SEARCH_COLUMNS = """
            aal.id,
            aal.admin_user_id,
            u.full_name AS admin_full_name,
            u.email AS admin_email,
            COALESCE(aal.admin_role, u.role::text) AS admin_role,
            aal.target_user_id,
            aal.action,
            aal.resource_type,
            aal.resource_id,
            aal.before_data::text AS before_data,
            aal.after_data::text AS after_data,
            aal.metadata::text AS metadata,
            aal.http_method,
            aal.request_path,
            aal.ip_address,
            aal.user_agent,
            aal.status_code,
            aal.latency_ms,
            aal.status,
            aal.created_at
            """;

    String SEARCH_FILTERS = """
            AND (:adminUserId IS NULL OR aal.admin_user_id = :adminUserId)
            AND (:action IS NULL OR aal.action = :action)
            AND (:resourceType IS NULL OR aal.resource_type = :resourceType)
            AND (:status IS NULL OR aal.status = :status)
            AND (:fromDate IS NULL OR aal.created_at >= :fromDate)
            AND (:toDate IS NULL OR aal.created_at <= :toDate)
            AND (:q IS NULL OR aal.request_path ILIKE :q OR aal.resource_id ILIKE :q
                 OR aal.action ILIKE :q OR aal.resource_type ILIKE :q)
            """;

    @Query("SELECT " + SEARCH_COLUMNS +
           "FROM admin_audit_logs aal " +
           "LEFT JOIN users u ON aal.admin_user_id = u.id " +
           "WHERE (:organizationId IS NULL OR aal.admin_user_id IN " +
           "       (SELECT om.user_id FROM organization_members om WHERE om.organization_id = :organizationId)) " +
           SEARCH_FILTERS +
           "ORDER BY aal.created_at DESC " +
           "LIMIT :limit OFFSET :offset")
    Flux<AdminAuditLogResponse> searchAuditLogs(
            @Param("organizationId") Integer organizationId,
            @Param("adminUserId") Integer adminUserId,
            @Param("action") String action,
            @Param("resourceType") String resourceType,
            @Param("status") String status,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            @Param("q") String q,
            @Param("limit") int limit,
            @Param("offset") int offset);

    @Query("SELECT COUNT(*) FROM admin_audit_logs aal " +
           "WHERE (:organizationId IS NULL OR aal.admin_user_id IN " +
           "       (SELECT om.user_id FROM organization_members om WHERE om.organization_id = :organizationId)) " +
           SEARCH_FILTERS)
    Mono<Long> countAuditLogs(
            @Param("organizationId") Integer organizationId,
            @Param("adminUserId") Integer adminUserId,
            @Param("action") String action,
            @Param("resourceType") String resourceType,
            @Param("status") String status,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            @Param("q") String q);

    @Query("SELECT DISTINCT action FROM admin_audit_logs " +
           "WHERE action IS NOT NULL " +
           "AND (:organizationId IS NULL OR admin_user_id IN " +
           "     (SELECT om.user_id FROM organization_members om WHERE om.organization_id = :organizationId)) " +
           "ORDER BY action")
    Flux<String> findDistinctActions(@Param("organizationId") Integer organizationId);

    @Query("SELECT DISTINCT resource_type FROM admin_audit_logs " +
           "WHERE resource_type IS NOT NULL " +
           "AND (:organizationId IS NULL OR admin_user_id IN " +
           "     (SELECT om.user_id FROM organization_members om WHERE om.organization_id = :organizationId)) " +
           "ORDER BY resource_type")
    Flux<String> findDistinctResourceTypes(@Param("organizationId") Integer organizationId);

    /**
     * Per-admin activity roll-up: how much each admin did, how much failed, and when they
     * were last active. Ordered by most recent activity.
     */
    @Query("SELECT aal.admin_user_id, u.full_name AS admin_full_name, u.email AS admin_email, " +
           "COALESCE(aal.admin_role, u.role::text) AS admin_role, " +
           "COUNT(*) AS total_actions, " +
           "COUNT(*) FILTER (WHERE aal.status = 'FAILURE' OR aal.status_code >= 400) AS failed_actions, " +
           "MAX(aal.created_at) AS last_action_at " +
           "FROM admin_audit_logs aal " +
           "LEFT JOIN users u ON aal.admin_user_id = u.id " +
           "WHERE (:organizationId IS NULL OR aal.admin_user_id IN " +
           "       (SELECT om.user_id FROM organization_members om WHERE om.organization_id = :organizationId)) " +
           "AND (:fromDate IS NULL OR aal.created_at >= :fromDate) " +
           "AND (:toDate IS NULL OR aal.created_at <= :toDate) " +
           "GROUP BY aal.admin_user_id, u.full_name, u.email, COALESCE(aal.admin_role, u.role::text) " +
           "ORDER BY last_action_at DESC")
    Flux<AdminAuditActorSummary> summarizeByAdmin(
            @Param("organizationId") Integer organizationId,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate);
}
