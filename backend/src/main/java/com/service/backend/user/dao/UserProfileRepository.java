package com.service.backend.user.dao;

import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;

import com.service.backend.shared.entity.User;
import com.service.backend.user.dto.UserProfileResponse;

import reactor.core.publisher.Mono;

@Repository
public interface UserProfileRepository extends R2dbcRepository<User, Integer> {

    @Query("""
            SELECT u.id AS user_id,
                   u.email,
                   u.user_name,
                   u.role,
                   u.status,
                   u.avatar_url,
                   u.created_at,
                   gp.full_name,
                   gp.phone,
                   gp.bio,
                   gp.dob,
                   gp.gender,
                   gp.updated_at AS profile_updated_at
            FROM users u
            LEFT JOIN global_profiles gp ON gp.user_id = u.id
            WHERE u.id = :userId
            """)
    Mono<UserProfileResponse> findProfileByUserId(Integer userId);

    @Modifying
    @Query("""
            INSERT INTO global_profiles (user_id, phone, gender, updated_at)
            VALUES (:userId, :phone, :gender, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id) DO UPDATE
            SET phone = COALESCE(:phone, global_profiles.phone),
                gender = COALESCE(:gender, global_profiles.gender),
                updated_at = CURRENT_TIMESTAMP
            """)
    Mono<Integer> upsertPhoneAndGender(Integer userId, String phone, String gender);
}
