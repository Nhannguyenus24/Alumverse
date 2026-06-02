package com.service.backend.admin.dao;

import com.service.backend.admin.dto.LoginHistoryResponse;
import com.service.backend.shared.entity.UserLoginHistory;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface AuditRepository extends R2dbcRepository<UserLoginHistory, Long> {

    @Query("SELECT ulh.id, ulh.user_id, ulh.login_at, ulh.login_method, ulh.login_ip, ulh.user_agent, " +
           "u.email, u.user_name " +
           "FROM user_login_histories ulh " +
           "INNER JOIN users u ON ulh.user_id = u.id " +
           "ORDER BY ulh.login_at DESC " +
           "LIMIT :limit OFFSET :offset")
    Flux<LoginHistoryResponse> findAllWithUserInfo(@Param("limit") int limit, @Param("offset") int offset);

    @Query("SELECT COUNT(*) FROM user_login_histories")
    Mono<Long> countAll();

    @Query("SELECT ulh.id, ulh.user_id, ulh.login_at, ulh.login_method, ulh.login_ip, ulh.user_agent, " +
           "u.email, u.user_name " +
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

    @Query("SELECT login_method, COUNT(*) AS login_count " +
           "FROM user_login_histories " +
           "GROUP BY login_method " +
           "ORDER BY login_count DESC")
    Flux<Object> getLoginMethodStats();

    @Query("SELECT CAST(login_at AS DATE) AS login_date, COUNT(*) AS login_count " +
           "FROM user_login_histories " +
           "WHERE login_at >= CURRENT_DATE - INTERVAL '30 days' " +
           "GROUP BY CAST(login_at AS DATE) " +
           "ORDER BY login_date DESC")
    Flux<Object> getDailyLoginStats();

    @Query("SELECT ulh.user_id, u.email, u.user_name, " +
           "COUNT(DISTINCT ulh.login_ip) AS distinct_ip_count, COUNT(*) AS total_logins " +
           "FROM user_login_histories ulh " +
           "INNER JOIN users u ON ulh.user_id = u.id " +
           "WHERE ulh.login_at >= CURRENT_TIMESTAMP - INTERVAL '7 days' " +
           "GROUP BY ulh.user_id, u.email, u.user_name " +
           "HAVING COUNT(DISTINCT ulh.login_ip) > 3 " +
           "ORDER BY distinct_ip_count DESC")
    Flux<Object> findSuspiciousLogins();
    
       @Query("SELECT COUNT(DISTINCT user_id) FROM user_login_histories WHERE login_at >= CURRENT_TIMESTAMP - INTERVAL '1 day'")
       Mono<Long> countDailyActive();

}
