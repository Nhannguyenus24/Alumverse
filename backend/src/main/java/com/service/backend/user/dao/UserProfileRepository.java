package com.service.backend.user.dao;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import reactor.core.publisher.Flux;
import com.service.backend.shared.dao.UserDisplayInfo;

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

    Mono<User> findByEmail(String email);

    @Query("""
            SELECT id AS user_id,
                   avatar_url,
                   cover_url,
                   full_name,
                   current_job_title,
                   current_company
            FROM users
            WHERE id IN (:userIds)
            """)
    Flux<UserDisplayInfo> streamByUserIds(@Param("userIds") Collection<Integer> userIds);

    @Query("""
            SELECT id AS user_id,
                   avatar_url,
                   cover_url,
                   full_name,
                   current_job_title,
                   current_company
            FROM users
            WHERE id IN (:memberIds)
            """)
    Flux<UserDisplayInfo> streamByMemberIds(@Param("memberIds") Collection<Integer> memberIds);

    default Mono<Map<Integer, UserDisplayInfo>> findByUserIds(Collection<Integer> userIds) {
        if (userIds == null || userIds.isEmpty()) return Mono.just(Map.of());
        return streamByUserIds(userIds.stream().distinct().toList())
                .collectMap(UserDisplayInfo::getUserId, info -> info);
    }

    default Mono<Map<Integer, UserDisplayInfo>> findByMemberIds(Collection<Integer> memberIds) {
        if (memberIds == null || memberIds.isEmpty()) return Mono.just(Map.of());
        return streamByMemberIds(memberIds.stream().distinct().toList())
                .collectMap(UserDisplayInfo::getUserId, info -> info);
    }

    default Mono<UserDisplayInfo> findDisplayInfoByUserId(Integer userId) {
        if (userId == null) return Mono.empty();
        return streamByUserIds(List.of(userId)).next();
    }

    record AttendeeProfile(Integer id, String fullName, String email, String avatarUrl) {}

    @Query("SELECT id, full_name, email, avatar_url FROM users WHERE id = :userId")
    Mono<AttendeeProfile> findAttendeeProfileByUserId(@Param("userId") Integer userId);

    @Query("SELECT id, full_name, email, avatar_url FROM users WHERE LOWER(email) = LOWER(:email) LIMIT 1")
    Mono<AttendeeProfile> findAttendeeProfileByEmail(@Param("email") String email);

    @Query("""
            SELECT u.id AS user_id,
                   u.email,
                   om.student_id as student_id,
                   o.name AS organization_name,
                   u.role,
                   u.status,
                   u.avatar_url,
                   u.cover_url,
                   u.created_at,
                   u.full_name,
                   u.phone,
                   u.bio,
                   u.dob,
                   u.gender,
                   u.current_job_title,
                   u.current_company,
                   CAST(u.links AS text) AS links,
                   u.updated_at AS profile_updated_at,
                   CAST(om.started_year AS text) AS started_year,
                   CAST(om.graduated_year AS text) AS graduated_year,
                   CAST(om.graduation_status AS text) AS graduation_status,
                   CAST(om.program AS text) AS program,
                   CAST(om.major AS text) AS major,
                   CAST(om.faculty AS text) AS faculty,
                   CAST(om.department AS text) AS department
            FROM users u
            LEFT JOIN organization_members om ON om.user_id = u.id AND (:organizationId IS NULL OR om.organization_id = :organizationId)
            LEFT JOIN organizations o ON o.id = om.organization_id
            WHERE u.id = :userId
            LIMIT 1
            """)
    Mono<UserProfileResponse> findProfileByUserId(@Param("userId") Integer userId, @Param("organizationId") Integer organizationId);

    @Modifying
    @Query("""
            UPDATE users
            SET full_name = COALESCE(NULLIF(:fullName, ''), full_name),
                phone = COALESCE(:phone, phone),
                gender = COALESCE(:gender, gender),
                dob = COALESCE(:dob, dob),
                bio = COALESCE(:bio, bio),
                current_job_title = COALESCE(:currentJobTitle, current_job_title),
                current_company = COALESCE(:currentCompany, current_company),
                links = COALESCE(CAST(:links AS jsonb), links),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :userId
            """)
    Mono<Integer> upsertProfileInfo(
            @Param("userId") Integer userId,
            @Param("fullName") String fullName,
            @Param("phone") String phone,
            @Param("gender") String gender,
            @Param("dob") java.time.LocalDate dob,
            @Param("bio") String bio,
            @Param("currentJobTitle") String currentJobTitle,
            @Param("currentCompany") String currentCompany,
            @Param("links") String links);

    @Modifying
    @Query("UPDATE users SET avatar_url = :avatarUrl WHERE id = :userId")
    Mono<Void> updateUserAvatar(
            @Param("userId") Integer userId,
            @Param("avatarUrl") String avatarUrl);

    @Modifying
    @Query("""
            UPDATE users
            SET current_job_title = COALESCE(:currentJobTitle, current_job_title),
                current_company = COALESCE(:currentCompany, current_company),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :userId
            """)
    Mono<Void> updateUserWorkInfo(
            @Param("userId") Integer userId,
            @Param("currentJobTitle") String currentJobTitle,
            @Param("currentCompany") String currentCompany);
}
