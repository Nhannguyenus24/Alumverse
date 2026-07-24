package com.service.backend.admin.dao;

import com.service.backend.admin.dto.LoginHistoryResponse;
import com.service.backend.admin.dto.SuspiciousLoginInfo;
import com.service.backend.shared.entity.UserLoginHistory;
import com.service.backend.shared.projection.DailyCountProjection;
import com.service.backend.shared.projection.LoginMethodProjection;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface AuditRepository extends R2dbcRepository<UserLoginHistory, Long> {

    @Query("SELECT ulh.id, ulh.user_id, ulh.login_at, ulh.login_method, ulh.login_ip, ulh.user_agent, " +
           "u.email " +
           "FROM user_login_histories ulh " +
           "INNER JOIN users u ON ulh.user_id = u.id " +
           "ORDER BY ulh.login_at DESC " +
           "LIMIT :limit OFFSET :offset")
    Flux<LoginHistoryResponse> findAllWithUserInfo(@Param("limit") int limit, @Param("offset") int offset);

    @Query("SELECT COUNT(*) FROM user_login_histories")
    Mono<Long> countAll();

    @Query("SELECT ulh.id, ulh.user_id, ulh.login_at, ulh.login_method, ulh.login_ip, ulh.user_agent, " +
           "u.email " +
           "FROM user_login_histories ulh " +
           "INNER JOIN users u ON ulh.user_id = u.id " +
           "WHERE ulh.user_id = :userId " +
           "ORDER BY ulh.login_at DESC " +
           "LIMIT :limit OFFSET :offset")
    Flux<LoginHistoryResponse> findByUserIdWithUserInfo(
            @Param("userId") Integer userId,
            @Param("limit") int limit,
            @Param("offset") int offset);

    @Query("SELECT COUNT(*) FROM user_login_histories WHERE user_id = :userId")
    Mono<Long> countByUserId(@Param("userId") Integer userId);

    @Query("SELECT login_method AS method, COUNT(*) AS count " +
           "FROM user_login_histories " +
           "GROUP BY login_method " +
           "ORDER BY count DESC")
    Flux<LoginMethodProjection> getLoginMethodStats();

    // 30-day window so the engagement chart aligns with loginsByHour / dailyLogins,
    // which also look back 30 days. The all-time variant above stays for AuditService.
    @Query("SELECT login_method AS method, COUNT(*) AS count " +
           "FROM user_login_histories " +
           "WHERE login_at >= CURRENT_DATE - INTERVAL '30 days' " +
           "GROUP BY login_method " +
           "ORDER BY count DESC")
    Flux<LoginMethodProjection> getLoginMethodStatsLast30Days();

    @Query("SELECT CAST(login_at AS DATE) AS date, COUNT(*) AS count " +
           "FROM user_login_histories " +
           "WHERE login_at >= CURRENT_DATE - INTERVAL '30 days' " +
           "GROUP BY CAST(login_at AS DATE) " +
           "ORDER BY date DESC")
    Flux<DailyCountProjection> getDailyLoginStats();

    @Query("SELECT ulh.user_id AS user_id, u.email AS email, " +
           "COUNT(DISTINCT ulh.login_ip) AS distinct_ip_count, COUNT(*) AS total_logins " +
           "FROM user_login_histories ulh " +
           "INNER JOIN users u ON ulh.user_id = u.id " +
           "WHERE ulh.login_at >= CURRENT_TIMESTAMP - INTERVAL '7 days' " +
           "GROUP BY ulh.user_id, u.email " +
           "HAVING COUNT(DISTINCT ulh.login_ip) > 3 " +
           "ORDER BY distinct_ip_count DESC")
    Flux<SuspiciousLoginInfo> findSuspiciousLogins();

    @Query("SELECT COUNT(DISTINCT user_id) FROM user_login_histories WHERE login_at >= CURRENT_TIMESTAMP - INTERVAL '1 day'")
    Mono<Long> countDailyActive();

    @Query("SELECT ulh.id, ulh.user_id, ulh.login_at, ulh.login_method, ulh.login_ip, ulh.user_agent, " +
           "u.email " +
           "FROM user_login_histories ulh " +
           "INNER JOIN users u ON ulh.user_id = u.id " +
           "INNER JOIN organization_members om ON ulh.user_id = om.user_id " +
           "WHERE om.organization_id = :organizationId " +
           "ORDER BY ulh.login_at DESC " +
           "LIMIT :limit OFFSET :offset")
    Flux<LoginHistoryResponse> findByOrganizationIdWithUserInfo(
            @Param("organizationId") Integer organizationId,
            @Param("limit") int limit,
            @Param("offset") int offset);

    @Query("SELECT COUNT(*) FROM user_login_histories ulh " +
           "INNER JOIN organization_members om ON ulh.user_id = om.user_id " +
           "WHERE om.organization_id = :organizationId")
    Mono<Long> countByOrganizationId(@Param("organizationId") Integer organizationId);
}
