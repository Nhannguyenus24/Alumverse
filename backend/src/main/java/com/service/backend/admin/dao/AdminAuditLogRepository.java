package com.service.backend.admin.dao;

import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.service.backend.admin.entity.AdminAuditLog;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface AdminAuditLogRepository extends R2dbcRepository<AdminAuditLog, Long> {
    @Modifying
    @Query("""
            INSERT INTO admin_audit_logs
                (admin_user_id, target_user_id, action, resource_type, resource_id, metadata, created_at)
            VALUES
                (:adminUserId, :targetUserId, :action, :resourceType, :resourceId, to_jsonb(CAST(:metadata AS text)), :createdAt)
            """)
    Mono<Integer> insertResetPasswordAuditLog(
            @Param("adminUserId") Integer adminUserId,
            @Param("targetUserId") Integer targetUserId,
            @Param("action") String action,
            @Param("resourceType") String resourceType,
            @Param("resourceId") String resourceId,
            @Param("metadata") String metadata,
            @Param("createdAt") java.time.LocalDateTime createdAt);

    @Modifying
    @Query("""
            INSERT INTO admin_audit_logs
                (admin_user_id, target_user_id, action, created_at)
            VALUES
                (:adminUserId, :targetUserId, :action, :createdAt)
            """)
    Mono<Integer> insertResetPasswordAuditLogLegacy(
            @Param("adminUserId") Integer adminUserId,
            @Param("targetUserId") Integer targetUserId,
            @Param("action") String action,
            @Param("createdAt") java.time.LocalDateTime createdAt);

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
}
