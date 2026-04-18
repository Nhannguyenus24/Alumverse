package com.service.backend.user.dao;

import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;

import com.service.backend.user.entity.UserLoginHistory;

import reactor.core.publisher.Flux;

@Repository
public interface UserLoginHistoryRepository extends R2dbcRepository<UserLoginHistory, Long> {

    @Query("SELECT * FROM user_login_histories WHERE user_id = :userId ORDER BY login_at DESC LIMIT :limit OFFSET :offset")
    Flux<UserLoginHistory> findByUserIdOrderByLoginAtDesc(Integer userId, int limit, int offset);
}
