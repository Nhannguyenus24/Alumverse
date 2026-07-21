package com.service.backend.admin.dao;

import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

import com.service.backend.admin.dto.VerificationRequestResponse;
import com.service.backend.admin.dto.LoginHistoryResponse;
import com.service.backend.shared.entity.User;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface AdminUserRepository extends R2dbcRepository<User, Integer> {

    /**
     * Ban a user by setting "status" to {@code Status.BANNED}
     * @param userId The user ID to ban
     * @return Mono of updated rows count
     */
    @Modifying
    @Query("UPDATE users SET \"status\" = 'BANNED', updated_at = CURRENT_TIMESTAMP WHERE id = :userId")
    Mono<Integer> banUserById(@Param("userId") Integer userId);

    /**
     * Get user verification requests with user id
     * @param userId The user ID
     * @return Flux of verification request data (JSON format)
     */
    @Query("SELECT vr.*, om.user_id " +
           "FROM verification_requests vr " +
           "INNER JOIN organization_members om ON vr.member_id = om.user_id AND vr.organization_id = om.organization_id " +
           "WHERE om.user_id = :userId " +
           "ORDER BY vr.created_at DESC")
    Flux<Object> findVerificationRequestsByUserId(@Param("userId") Integer userId);

    /**
     * Count all users
     * @return Mono of total user count
     */
    @Query("SELECT COUNT(*) FROM users")
    Mono<Long> countAllUsers();

    /**
     * Watch user with peer verifications (get users who verified this user)
     * @param userId The target user ID
     * @return Flux of verifier user data
     */
    @Query("SELECT u.*, pv.created_at as verification_date " +
           "FROM peer_verifications pv " +
           "INNER JOIN organization_members om_target ON pv.target_member_id = om_target.user_id AND pv.organization_id = om_target.organization_id " +
           "INNER JOIN organization_members om_verifier ON pv.verifier_member_id = om_verifier.user_id AND pv.organization_id = om_verifier.organization_id " +
           "INNER JOIN users u ON om_verifier.user_id = u.id " +
           "WHERE om_target.user_id = :userId " +
           "ORDER BY pv.created_at DESC")
    Flux<Object> findPeerVerificationsByUserId(@Param("userId") Integer userId);
    
    /**
     * Delete a user by user id (soft delete: {@code Status.DELETED})
     * Note: Hard delete should be avoided due to foreign key constraints
     * @param userId The user ID to delete
     * @return Mono of updated rows count
     */
    @Modifying
    @Query("UPDATE users SET \"status\" = 'DELETED', updated_at = CURRENT_TIMESTAMP WHERE id = :userId")
    Mono<Integer> softDeleteUserById(@Param("userId") Integer userId);
    
    /**
     * Hard delete a user by user id
     * WARNING: This will fail if there are foreign key constraints
     * @param userId The user ID to delete
     * @return Mono of void
     */
    @Modifying
    @Query("DELETE FROM users WHERE id = :userId")
    Mono<Void> hardDeleteUserById(@Param("userId") Integer userId);

    /**
     * Unban a user by setting "status" back to ACTIVE
     */
    @Modifying
    @Query("UPDATE users SET \"status\" = 'ACTIVE', updated_at = CURRENT_TIMESTAMP WHERE id = :userId")
    Mono<Integer> unbanUserById(@Param("userId") Integer userId);

    @Modifying
    @Query("UPDATE users SET \"status\" = :status, updated_at = CURRENT_TIMESTAMP WHERE id = :userId")
    Mono<Integer> updateUserStatusById(@Param("userId") Integer userId, @Param("status") String status);

    @Modifying
    @Query("""
            UPDATE users
            SET email = COALESCE(:email, email),
                password_hash = COALESCE(:passwordHash, password_hash),
                role = COALESCE(:role, role),
                "status" = COALESCE(:status, "status"),
                phone = COALESCE(:phone, phone),
                dob = COALESCE(CAST(:dob AS date), dob),
                gender = COALESCE(:gender, gender),
                must_change_password = CASE
                    WHEN :mustChangePassword = TRUE THEN TRUE
                    ELSE must_change_password
                END,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :userId
            """)
    Mono<Integer> updateUserAccountFields(
            @Param("userId") Integer userId,
            @Param("email") String email,
            @Param("passwordHash") String passwordHash,
            @Param("role") String role,
            @Param("status") String status,
            @Param("phone") String phone,
            @Param("dob") java.time.LocalDate dob,
            @Param("gender") String gender,
            @Param("mustChangePassword") Boolean mustChangePassword);

    @Query("SELECT COUNT(*) FROM verification_requests vr " +
           "JOIN users u ON vr.member_id = u.id " +
           "JOIN organization_members om ON u.id = om.user_id AND vr.organization_id = om.organization_id " +
           "WHERE vr.\"status\" = 'PENDING' " +
           "AND (:keyword IS NULL OR u.email ILIKE :keyword OR om.student_id ILIKE :keyword OR u.full_name ILIKE :keyword)")
    Mono<Long> countPendingVerificationRequests(@Param("keyword") String keyword);

    @Query("""
            SELECT *
            FROM (
                SELECT
                    vr.id AS id,
                    vr.member_id AS member_id,
                    vr.organization_id AS organization_id,
                    'PROOF' AS request_type,
                    u.full_name AS full_name,
                    u.avatar_url AS avatar_url,
                    u.email AS email,
                    om.student_id AS student_id,
                    vr.document_url AS document_url,
                    CAST(vr.document_type AS text) AS document_type,
                    vr.ai_summary AS ai_summary,
                    NULL::text AS evidence_summary,
                    NULL::text AS confirmed_verifiers,
                    NULL::text AS pending_verifiers,
                    CAST(vr."status" AS text) AS status,
                    vr.admin_note AS admin_note,
                    vr.reviewed_by_member_id AS reviewed_by_member_id,
                    vr.created_at AS created_at,
                    vr.updated_at AS updated_at
                FROM verification_requests vr
                JOIN users u ON vr.member_id = u.id
                JOIN organization_members om ON vr.member_id = om.user_id AND vr.organization_id = om.organization_id

                UNION ALL

                SELECT
                    MIN(pv.id) AS id,
                    pv.target_member_id AS member_id,
                    pv.organization_id AS organization_id,
                    'PEER' AS request_type,
                    target_user.full_name AS full_name,
                    target_user.avatar_url AS avatar_url,
                    target_user.email AS email,
                    target_member.student_id AS student_id,
                    NULL::text AS document_url,
                    NULL::text AS document_type,
                    NULL::text AS ai_summary,
                    STRING_AGG(
                        CONCAT(COALESCE(verifier_user.full_name, verifier_user.email, CONCAT('User ', pv.verifier_member_id)), ' - ', CAST(pv."status" AS text)),
                        ', ' ORDER BY pv.created_at
                    ) AS evidence_summary,
                    STRING_AGG(
                        COALESCE(verifier_user.full_name, verifier_user.email, CONCAT('User ', pv.verifier_member_id)),
                        ', ' ORDER BY pv.created_at
                    ) FILTER (WHERE CAST(pv."status" AS text) IN ('APPROVED', 'ACCEPTED')) AS confirmed_verifiers,
                    STRING_AGG(
                        COALESCE(verifier_user.full_name, verifier_user.email, CONCAT('User ', pv.verifier_member_id)),
                        ', ' ORDER BY pv.created_at
                    ) FILTER (WHERE CAST(pv."status" AS text) = 'PENDING') AS pending_verifiers,
                    CASE
                        WHEN COUNT(*) FILTER (WHERE CAST(pv."status" AS text) IN ('APPROVED', 'ACCEPTED')) > 0 THEN 'APPROVED'
                        WHEN COUNT(*) FILTER (WHERE CAST(pv."status" AS text) = 'PENDING') > 0 THEN 'PENDING'
                        WHEN COUNT(*) FILTER (WHERE CAST(pv."status" AS text) = 'NEED_UPDATE') > 0 THEN 'NEED_UPDATE'
                        WHEN COUNT(*) FILTER (WHERE CAST(pv."status" AS text) = 'REJECTED') > 0 THEN 'REJECTED'
                        ELSE MAX(CAST(pv."status" AS text))
                    END AS status,
                    NULL::text AS admin_note,
                    NULL::integer AS reviewed_by_member_id,
                    MIN(pv.created_at) AS created_at,
                    MAX(pv.created_at) AS updated_at
                FROM peer_verifications pv
                JOIN users target_user ON target_user.id = pv.target_member_id
                JOIN organization_members target_member
                    ON target_member.user_id = pv.target_member_id
                   AND target_member.organization_id = pv.organization_id
                LEFT JOIN users verifier_user ON verifier_user.id = pv.verifier_member_id
                GROUP BY pv.organization_id, pv.target_member_id, target_user.full_name,
                         target_user.avatar_url, target_user.email, target_member.student_id
            ) combined
            WHERE (CAST(:organizationId AS INTEGER) IS NULL OR combined.organization_id = :organizationId)
              AND (:pendingOnly = FALSE OR combined.status = 'PENDING')
              AND (CAST(:requestType AS TEXT) IS NULL OR combined.request_type = :requestType)
              AND (
                  CAST(:keyword AS TEXT) IS NULL
                  OR combined.email ILIKE :keyword
                  OR combined.student_id ILIKE :keyword
                  OR combined.full_name ILIKE :keyword
                  OR combined.evidence_summary ILIKE :keyword
              )
            ORDER BY combined.created_at DESC
            LIMIT :limit OFFSET :offset
            """)
    Flux<VerificationRequestResponse> findUnifiedVerificationRequests(
            @Param("organizationId") Integer organizationId,
            @Param("keyword") String keyword,
            @Param("pendingOnly") boolean pendingOnly,
            @Param("requestType") String requestType,
            @Param("limit") int limit,
            @Param("offset") int offset);

    @Query("""
            SELECT COUNT(*)
            FROM (
                SELECT
                    vr.organization_id AS organization_id,
                    'PROOF' AS request_type,
                    u.full_name AS full_name,
                    u.email AS email,
                    om.student_id AS student_id,
                    NULL::text AS evidence_summary,
                    CAST(vr."status" AS text) AS status
                FROM verification_requests vr
                JOIN users u ON vr.member_id = u.id
                JOIN organization_members om ON vr.member_id = om.user_id AND vr.organization_id = om.organization_id

                UNION ALL

                SELECT
                    pv.organization_id AS organization_id,
                    'PEER' AS request_type,
                    target_user.full_name AS full_name,
                    target_user.email AS email,
                    target_member.student_id AS student_id,
                    STRING_AGG(
                        COALESCE(verifier_user.full_name, verifier_user.email, CONCAT('User ', pv.verifier_member_id)),
                        ', ' ORDER BY pv.created_at
                    ) AS evidence_summary,
                    CASE
                        WHEN COUNT(*) FILTER (WHERE CAST(pv."status" AS text) IN ('APPROVED', 'ACCEPTED')) > 0 THEN 'APPROVED'
                        WHEN COUNT(*) FILTER (WHERE CAST(pv."status" AS text) = 'PENDING') > 0 THEN 'PENDING'
                        WHEN COUNT(*) FILTER (WHERE CAST(pv."status" AS text) = 'NEED_UPDATE') > 0 THEN 'NEED_UPDATE'
                        WHEN COUNT(*) FILTER (WHERE CAST(pv."status" AS text) = 'REJECTED') > 0 THEN 'REJECTED'
                        ELSE MAX(CAST(pv."status" AS text))
                    END AS status
                FROM peer_verifications pv
                JOIN users target_user ON target_user.id = pv.target_member_id
                JOIN organization_members target_member
                    ON target_member.user_id = pv.target_member_id
                   AND target_member.organization_id = pv.organization_id
                LEFT JOIN users verifier_user ON verifier_user.id = pv.verifier_member_id
                GROUP BY pv.organization_id, pv.target_member_id, target_user.full_name,
                         target_user.email, target_member.student_id
            ) combined
            WHERE (CAST(:organizationId AS INTEGER) IS NULL OR combined.organization_id = :organizationId)
              AND (:pendingOnly = FALSE OR combined.status = 'PENDING')
              AND (CAST(:requestType AS TEXT) IS NULL OR combined.request_type = :requestType)
              AND (
                  CAST(:keyword AS TEXT) IS NULL
                  OR combined.email ILIKE :keyword
                  OR combined.student_id ILIKE :keyword
                  OR combined.full_name ILIKE :keyword
                  OR combined.evidence_summary ILIKE :keyword
              )
            """)
    Mono<Long> countUnifiedVerificationRequests(
            @Param("organizationId") Integer organizationId,
            @Param("keyword") String keyword,
            @Param("pendingOnly") boolean pendingOnly,
            @Param("requestType") String requestType);

    /**
     * Update verification request "status" and admin note
     */
    @Modifying
    @Query("UPDATE verification_requests " +
           "SET \"status\" = :status, admin_note = :adminNote, updated_at = CURRENT_TIMESTAMP " +
           "WHERE id = :requestId")
    Mono<Integer> reviewVerificationRequest(
            @Param("requestId") Integer requestId,
            @Param("status") String status,
            @Param("adminNote") String adminNote);

    @Modifying
    @Query("""
            UPDATE verification_requests
            SET "status" = 'NEED_UPDATE',
                admin_note = :adminNote,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :requestId AND "status" = 'PENDING'
            """)
    Mono<Integer> markVerificationRequestNeedsUpdate(
            @Param("requestId") Integer requestId,
            @Param("adminNote") String adminNote);

    @Query("SELECT EXISTS(SELECT 1 FROM organization_members WHERE user_id = :userId)")
    Mono<Boolean> existsOrganizationMemberByUserId(@Param("userId") Integer userId);

    @Modifying
    @Query("INSERT INTO organization_members (organization_id, user_id, student_id, faculty, started_year, graduated_year, graduation_status, program, major, department, verification_level, is_trusted_verifier, \"status\", created_at, updated_at) " +
           "VALUES (:organizationId, :userId, :studentId, CAST(:faculty AS jsonb), CAST(:startedYear AS jsonb), CAST(:graduatedYear AS jsonb), CAST(:graduationStatus AS jsonb), CAST(:program AS jsonb), CAST(:major AS jsonb), CAST(:department AS jsonb), :verificationLevel, :isTrustedVerifier, :status, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)")
    Mono<Integer> createOrganizationMember(
           @Param("organizationId") Integer organizationId,
           @Param("userId") Integer userId,
           @Param("studentId") String studentId,
           @Param("faculty") String faculty,
           @Param("startedYear") String startedYear,
           @Param("graduatedYear") String graduatedYear,
           @Param("graduationStatus") String graduationStatus,
           @Param("program") String program,
           @Param("major") String major,
           @Param("department") String department,
           @Param("verificationLevel") Integer verificationLevel,
           @Param("isTrustedVerifier") Boolean isTrustedVerifier,
           @Param("status") String status);

    @Modifying
    @Query("UPDATE organization_members SET organization_id = :organizationId, student_id = COALESCE(:studentId, student_id), " +
           "faculty = CAST(:faculty AS jsonb), started_year = CAST(:startedYear AS jsonb), " +
           "graduated_year = CAST(:graduatedYear AS jsonb), " +
           "graduation_status = CAST(:graduationStatus AS jsonb), program = CAST(:program AS jsonb), major = CAST(:major AS jsonb), " +
           "department = CAST(:department AS jsonb), " +
           "verification_level = :verificationLevel, is_trusted_verifier = :isTrustedVerifier, \"status\" = :status, updated_at = CURRENT_TIMESTAMP " +
           "WHERE user_id = :userId")
    Mono<Integer> updateOrganizationMemberByUserId(
           @Param("organizationId") Integer organizationId,
           @Param("userId") Integer userId,
           @Param("studentId") String studentId,
           @Param("faculty") String faculty,
           @Param("startedYear") String startedYear,
           @Param("graduatedYear") String graduatedYear,
           @Param("graduationStatus") String graduationStatus,
           @Param("program") String program,
           @Param("major") String major,
           @Param("department") String department,
           @Param("verificationLevel") Integer verificationLevel,
           @Param("isTrustedVerifier") Boolean isTrustedVerifier,
           @Param("status") String status);

    @Query("SELECT ulh.id, ulh.user_id, ulh.login_at, ulh.login_method, ulh.login_ip, ulh.user_agent, " +
           "u.email " +
           "FROM user_login_histories ulh " +
           "INNER JOIN users u ON ulh.user_id = u.id " +
           "WHERE ulh.user_id = :userId " +
           "ORDER BY ulh.login_at DESC " +
           "LIMIT :limit")
    Flux<LoginHistoryResponse> findRecentLoginHistories(@Param("userId") Integer userId, @Param("limit") int limit);

    @Query("SELECT id, member_id, document_url, document_type, \"status\", admin_note, reviewed_by_member_id, created_at, updated_at " +
           "FROM verification_requests WHERE member_id = :userId ORDER BY created_at DESC LIMIT :limit")
    Flux<Object> findRecentVerificationRequests(@Param("userId") Integer userId, @Param("limit") int limit);

    @Modifying
    @Query("UPDATE users SET password_hash = :passwordHash, updated_at = CURRENT_TIMESTAMP WHERE id = :userId")
    Mono<Integer> resetPasswordByAdmin(@Param("userId") Integer userId, @Param("passwordHash") String passwordHash);

    @Query("SELECT EXISTS(SELECT 1 FROM users WHERE email = :email)")
    Mono<Boolean> existsByEmail(@Param("email") String email);

    @Query("INSERT INTO users (email, password_hash, role, \"status\", must_change_password, created_at, updated_at) " +
           "VALUES (:email, :passwordHash, 'ADMIN', 'ACTIVE', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) " +
           "RETURNING id")
    Mono<Integer> createAdminUser(
            @Param("email") String email,
            @Param("passwordHash") String passwordHash);

    @Modifying
    @Query("UPDATE users SET full_name = :fullName, updated_at = CURRENT_TIMESTAMP WHERE id = :userId")
    Mono<Void> createGlobalProfile(@Param("userId") Integer userId, @Param("fullName") String fullName);

    @Modifying
    @Query("UPDATE users SET full_name = :fullName, updated_at = CURRENT_TIMESTAMP WHERE id = :userId")
    Mono<Integer> upsertGlobalProfileFullName(@Param("userId") Integer userId, @Param("fullName") String fullName);

    @Query("""
            INSERT INTO organization_members (
                organization_id, user_id, graduated_year, graduation_status, program, major,
                verification_level, is_trusted_verifier, "status", created_at, updated_at)
            VALUES (
                :organizationId, :userId, NULL, NULL, NULL, NULL, 0, false, 'ACTIVE',
                CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (organization_id, user_id) DO UPDATE SET
                updated_at = CURRENT_TIMESTAMP
            """)
    Mono<Integer> upsertOrganizationMemberByUserId(
            @Param("organizationId") Integer organizationId,
            @Param("userId") Integer userId);

    @Modifying
    @Query("""
            UPDATE organization_members
            SET organization_id = COALESCE(:organizationId, organization_id),
                student_id = COALESCE(NULLIF(:studentId, ''), student_id),
                faculty = COALESCE(CAST(:faculty AS jsonb), faculty),
                started_year = COALESCE(CAST(:startedYear AS jsonb), started_year),
                graduated_year = COALESCE(CAST(:graduatedYear AS jsonb), graduated_year),
                graduation_status = COALESCE(CAST(:graduationStatus AS jsonb), graduation_status),
                program = COALESCE(CAST(:program AS jsonb), program),
                major = COALESCE(CAST(:major AS jsonb), major),
                department = COALESCE(CAST(:department AS jsonb), department),
                verification_level = COALESCE(:verificationLevel, verification_level),
                is_trusted_verifier = COALESCE(:isTrustedVerifier, is_trusted_verifier),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = (
                SELECT id FROM organization_members
                WHERE user_id = :userId
                ORDER BY id ASC
                LIMIT 1
            )
            """)
    Mono<Integer> updatePrimaryOrganizationMemberDetails(
            @Param("userId") Integer userId,
            @Param("organizationId") Integer organizationId,
            @Param("studentId") String studentId,
            @Param("faculty") String faculty,
            @Param("startedYear") String startedYear,
            @Param("graduatedYear") String graduatedYear,
            @Param("graduationStatus") String graduationStatus,
            @Param("program") String program,
            @Param("major") String major,
            @Param("department") String department,
            @Param("verificationLevel") Integer verificationLevel,
            @Param("isTrustedVerifier") Boolean isTrustedVerifier);

    @Modifying
    @Query("UPDATE organization_members SET is_trusted_verifier = :isTrusted, updated_at = CURRENT_TIMESTAMP " +
           "WHERE user_id = :userId AND organization_id = :organizationId")
    Mono<Integer> updateIsTrustedVerifier(
            @Param("userId") Integer userId,
            @Param("organizationId") Integer organizationId,
            @Param("isTrusted") boolean isTrusted);

    @Query("""
        SELECT DISTINCT u.id, u.email, u.password_hash, u.status, u.role, u.avatar_url, u.cover_url,
                        u.full_name, u.phone, u.bio, u.dob, u.gender, u.settings,
                        u.created_at, u.updated_at
        FROM users u
        LEFT JOIN organization_members om ON u.id = om.user_id
        WHERE (CAST(:search AS TEXT) IS NULL OR u.email ILIKE :search OR om.student_id ILIKE :search OR u.full_name ILIKE :search)
          AND (CAST(:role AS TEXT) IS NULL OR CAST(u.role AS TEXT) = :role)
          AND (
              CAST(:status AS TEXT) IS NULL
              OR (
                  :status = 'VERIFYING'
                  AND CAST(u."status" AS TEXT) = 'ACTIVE'
                  AND COALESCE(om.verification_level, 0) = 1
              )
              OR (
                  :status = 'UNVERIFIED'
                  AND (
                      CAST(u."status" AS TEXT) = 'UNVERIFIED'
                      OR (
                          CAST(u."status" AS TEXT) = 'ACTIVE'
                          AND COALESCE(om.verification_level, 0) = 0
                      )
                  )
              )
              OR (
                  :status = 'ACTIVE'
                  AND CAST(u."status" AS TEXT) = 'ACTIVE'
                  AND COALESCE(om.verification_level, 2) >= 2
              )
              OR (
                  :status NOT IN ('VERIFYING', 'UNVERIFIED', 'ACTIVE')
                  AND CAST(u."status" AS TEXT) = :status
              )
          )
          AND (CAST(:organizationId AS INTEGER) IS NULL OR om.organization_id = :organizationId)
          AND (:excludeAdmin = FALSE OR CAST(u.role AS TEXT) <> 'ADMIN')
        ORDER BY u.created_at DESC
        LIMIT :limit OFFSET :offset
        """)
    Flux<User> findUsersWithFilters(
        @Param("search") String search,
        @Param("role") String role,
        @Param("status") String status,
        @Param("organizationId") Integer organizationId,
        @Param("excludeAdmin") boolean excludeAdmin,
        @Param("limit") int limit,
        @Param("offset") int offset
    );

    @Query("""
        SELECT COUNT(DISTINCT u.id) FROM users u
        LEFT JOIN organization_members om ON u.id = om.user_id
        WHERE (CAST(:search AS TEXT) IS NULL OR u.email ILIKE :search OR om.student_id ILIKE :search OR u.full_name ILIKE :search)
          AND (CAST(:role AS TEXT) IS NULL OR CAST(u.role AS TEXT) = :role)
          AND (
              CAST(:status AS TEXT) IS NULL
              OR (
                  :status = 'VERIFYING'
                  AND CAST(u."status" AS TEXT) = 'ACTIVE'
                  AND COALESCE(om.verification_level, 0) = 1
              )
              OR (
                  :status = 'UNVERIFIED'
                  AND (
                      CAST(u."status" AS TEXT) = 'UNVERIFIED'
                      OR (
                          CAST(u."status" AS TEXT) = 'ACTIVE'
                          AND COALESCE(om.verification_level, 0) = 0
                      )
                  )
              )
              OR (
                  :status = 'ACTIVE'
                  AND CAST(u."status" AS TEXT) = 'ACTIVE'
                  AND COALESCE(om.verification_level, 2) >= 2
              )
              OR (
                  :status NOT IN ('VERIFYING', 'UNVERIFIED', 'ACTIVE')
                  AND CAST(u."status" AS TEXT) = :status
              )
          )
          AND (CAST(:organizationId AS INTEGER) IS NULL OR om.organization_id = :organizationId)
          AND (:excludeAdmin = FALSE OR CAST(u.role AS TEXT) <> 'ADMIN')
        """)
    Mono<Long> countUsersWithFilters(
        @Param("search") String search,
        @Param("role") String role,
        @Param("status") String status,
        @Param("organizationId") Integer organizationId,
        @Param("excludeAdmin") boolean excludeAdmin
    );

    @Query("SELECT CAST(created_at AS DATE) AS date, COUNT(*) AS count " +
           "FROM users " +
           "WHERE created_at >= CURRENT_DATE - INTERVAL '30 days' " +
           "GROUP BY CAST(created_at AS DATE) " +
           "ORDER BY date")
    Flux<com.service.backend.shared.projection.DailyCountProjection> getDailyUserRegistrations();

    @Query("""
        SELECT
            SUM(CASE WHEN created_at >= :today THEN 1 ELSE 0 END) AS new_users_today,
            SUM(CASE WHEN created_at >= :sevenDaysAgo THEN 1 ELSE 0 END) AS new_users7_days,
            SUM(CASE WHEN created_at >= :thirtyDaysAgo THEN 1 ELSE 0 END) AS new_users30_days,
            SUM(CASE WHEN "status" = 'ACTIVE' THEN 1 ELSE 0 END) AS active_users,
            SUM(CASE WHEN "status" = 'BANNED' THEN 1 ELSE 0 END) AS banned_users,
            SUM(CASE WHEN "status" = 'DELETED' THEN 1 ELSE 0 END) AS deleted_users
        FROM users
    """)
    Mono<com.service.backend.admin.dto.UserGrowthStatsProjection> getAggregatedUserGrowthStats(
        @Param("today") LocalDateTime today,
        @Param("sevenDaysAgo") LocalDateTime sevenDaysAgo,
        @Param("thirtyDaysAgo") LocalDateTime thirtyDaysAgo
    );

    @Query("""
        SELECT
            COUNT(*) AS total_requests,
            SUM(CASE WHEN "status" = 'PENDING' THEN 1 ELSE 0 END) AS pending_requests,
            SUM(CASE WHEN "status" = 'APPROVED' THEN 1 ELSE 0 END) AS approved_requests,
            SUM(CASE WHEN "status" = 'REJECTED' THEN 1 ELSE 0 END) AS rejected_requests,
            SUM(CASE WHEN "status" = 'NEEDS_REVISION' THEN 1 ELSE 0 END) AS needs_revision_requests
        FROM verification_requests
    """)
    Mono<com.service.backend.admin.dto.VerificationStatsProjection> getAggregatedVerificationStats();

    @Query("""
        SELECT
            COUNT(*) AS total_verifications,
            SUM(CASE WHEN "status" = 'PENDING' THEN 1 ELSE 0 END) AS pending_verifications,
            SUM(CASE WHEN "status" = 'APPROVED' THEN 1 ELSE 0 END) AS approved_verifications
        FROM peer_verifications
    """)
    Mono<com.service.backend.admin.dto.PeerVerificationStatsProjection> getAggregatedPeerVerificationStats();

    @Query("SELECT member_id, organization_id FROM verification_requests WHERE id = :requestId")
    Mono<com.service.backend.admin.dto.VerificationRequestInfo> findVerificationRequestInfoById(@Param("requestId") Integer requestId);
}
