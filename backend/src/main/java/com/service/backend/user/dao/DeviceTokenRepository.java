package com.service.backend.user.dao;

import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;

import com.service.backend.shared.entity.DeviceToken;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface DeviceTokenRepository extends R2dbcRepository<DeviceToken, Integer> {

    @Query("SELECT fcm_token FROM device_tokens WHERE user_id = :userId")
    Flux<String> findTokensByUserId(Integer userId);

    // Upsert: one row per fcm_token, re-point it to the current user on conflict.
    @Modifying
    @Query("INSERT INTO device_tokens (user_id, fcm_token, platform, created_at, updated_at) "
            + "VALUES (:userId, :fcmToken, :platform, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) "
            + "ON CONFLICT (fcm_token) DO UPDATE SET user_id = :userId, platform = :platform, "
            + "updated_at = CURRENT_TIMESTAMP")
    Mono<Integer> upsertToken(Integer userId, String fcmToken, String platform);

    @Modifying
    @Query("DELETE FROM device_tokens WHERE fcm_token = :fcmToken")
    Mono<Integer> deleteByToken(String fcmToken);
}
