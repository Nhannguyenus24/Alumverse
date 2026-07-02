package com.service.backend.user.dao;

import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.service.backend.shared.entity.User;
import com.service.backend.user.dto.UserProfileResponse;

import reactor.core.publisher.Mono;

@Repository
public interface UserProfileRepository extends R2dbcRepository<User, Integer> {

    @Query("""
            SELECT u.id AS user_id,
                   u.email,
                   om.student_id as student_id,
                   u.role,
                   u.status,
                   u.avatar_url,
                   u.created_at,
                   u.full_name,
                   u.phone,
                   u.bio,
                   u.dob,
                   u.gender,
                   u.updated_at AS profile_updated_at,
                   CAST(om.started_year AS text) AS started_year,
                   CAST(om.graduated_year AS text) AS graduated_year,
                   CAST(om.graduation_status AS text) AS graduation_status,
                   CAST(om.program AS text) AS program,
                   CAST(om.major AS text) AS major,
                   CAST(om.faculty AS text) AS faculty,
                   CAST(om.department AS text) AS department
            FROM users u
            LEFT JOIN organization_members om ON om.user_id = u.id
            WHERE u.id = :userId
            """)
    Mono<UserProfileResponse> findProfileByUserId(@Param("userId") Integer userId);

    @Modifying
    @Query("""
            UPDATE users
            SET phone = COALESCE(:phone, phone),
                gender = COALESCE(:gender, gender),
                bio = COALESCE(:bio, bio),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :userId
            """)
    Mono<Integer> upsertProfileInfo(
            @Param("userId") Integer userId,
            @Param("phone") String phone,
            @Param("gender") String gender,
            @Param("bio") String bio);
}
