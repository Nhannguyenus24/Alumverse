package com.service.backend.admin.dao;

import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.service.backend.admin.dto.VerificationRequestResponse;
import com.service.backend.admin.dto.LoginHistoryResponse;
import com.service.backend.auth.entity.User;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface AdminUserRepository extends R2dbcRepository<User, Integer> {
    
    /**
     * Get users in organization with pagination
     * @param organizationId The organization ID
     * @param limit The maximum number of results
     * @param offset The offset for pagination
     * @return Flux of users
     */
    @Query("SELECT u.* FROM users u " +
           "INNER JOIN organization_members om ON u.id = om.user_id " +
           "WHERE om.organization_id = :organizationId " +
           "ORDER BY u.created_at DESC " +
           "LIMIT :limit OFFSET :offset")
    Flux<User> findUsersByOrganizationWithPagination(
        @Param("organizationId") Integer organizationId, 
        @Param("limit") int limit, 
        @Param("offset") int offset
    );
    
    /**
     * Count users in organization
     * @param organizationId The organization ID
     * @return Mono of count
     */
    @Query("SELECT COUNT(*) FROM users u " +
           "INNER JOIN organization_members om ON u.id = om.user_id " +
           "WHERE om.organization_id = :organizationId")
    Mono<Long> countUsersByOrganization(@Param("organizationId") Integer organizationId);

    /**
     * Ban a user by setting status to 'banned'
     * @param userId The user ID to ban
     * @return Mono of updated rows count
     */
    @Modifying
    @Query("UPDATE users SET status = 'banned', updated_at = CURRENT_TIMESTAMP WHERE id = :userId")
    Mono<Integer> banUserById(@Param("userId") Integer userId);

    /**
     * Get user verification requests with user id
     * @param userId The user ID
     * @return Flux of verification request data (JSON format)
     */
    @Query("SELECT vr.*, om.user_id " +
           "FROM verification_requests vr " +
           "INNER JOIN organization_members om ON vr.member_id = om.id " +
           "WHERE om.user_id = :userId " +
           "ORDER BY vr.created_at DESC")
    Flux<Object> findVerificationRequestsByUserId(@Param("userId") Integer userId);
    
    /**
     * Get all users
     * @return Flux of all users
     */
    @Query("SELECT * FROM users ORDER BY created_at DESC")
    Flux<User> findAllUsers();
    
    /**
     * Get all users with pagination
     * @param limit The maximum number of results
     * @param offset The offset for pagination
     * @return Flux of users
     */
    @Query("SELECT * FROM users ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<User> findAllUsersWithPagination(@Param("limit") int limit, @Param("offset") int offset);
    
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
           "INNER JOIN organization_members om_target ON pv.target_member_id = om_target.id " +
           "INNER JOIN organization_members om_verifier ON pv.verifier_member_id = om_verifier.id " +
           "INNER JOIN users u ON om_verifier.user_id = u.id " +
           "WHERE om_target.user_id = :userId " +
           "ORDER BY pv.created_at DESC")
    Flux<Object> findPeerVerificationsByUserId(@Param("userId") Integer userId);
    
    /**
     * Delete a user by user id (soft delete: {@code UserStatus.DELETED})
     * Note: Hard delete should be avoided due to foreign key constraints
     * @param userId The user ID to delete
     * @return Mono of updated rows count
     */
    @Modifying
    @Query("UPDATE users SET status = 'DELETED', updated_at = CURRENT_TIMESTAMP WHERE id = :userId")
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
     * Unban a user by setting status back to ACTIVE
     */
    @Modifying
    @Query("UPDATE users SET status = 'ACTIVE', updated_at = CURRENT_TIMESTAMP WHERE id = :userId")
    Mono<Integer> unbanUserById(@Param("userId") Integer userId);

    /**
     * Fetch all verification requests joined with user info, paginated
     */
    @Query("SELECT vr.id, vr.member_id, vr.document_url, vr.document_type, vr.status, vr.admin_note, " +
           "vr.reviewed_by_member_id, vr.created_at, vr.updated_at, u.email, u.user_name " +
           "FROM verification_requests vr " +
           "JOIN users u ON vr.member_id = u.id " +
           "ORDER BY vr.created_at DESC " +
           "LIMIT :limit OFFSET :offset")
    Flux<VerificationRequestResponse> findAllVerificationRequests(@Param("limit") int limit, @Param("offset") int offset);

    @Query("SELECT COUNT(*) FROM verification_requests")
    Mono<Long> countAllVerificationRequests();

    /**
     * Fetch only pending verification requests, paginated
     */
    @Query("SELECT vr.id, vr.member_id, vr.document_url, vr.document_type, vr.status, vr.admin_note, " +
           "vr.reviewed_by_member_id, vr.created_at, vr.updated_at, u.email, u.user_name " +
           "FROM verification_requests vr " +
           "JOIN users u ON vr.member_id = u.id " +
           "WHERE vr.status = 'pending' " +
           "ORDER BY vr.created_at DESC " +
           "LIMIT :limit OFFSET :offset")
    Flux<VerificationRequestResponse> findPendingVerificationRequests(@Param("limit") int limit, @Param("offset") int offset);

    @Query("SELECT COUNT(*) FROM verification_requests WHERE status = 'pending'")
    Mono<Long> countPendingVerificationRequests();

    /**
     * Update verification request status and admin note
     */
    @Modifying
    @Query("UPDATE verification_requests " +
           "SET status = :status, admin_note = :adminNote, updated_at = CURRENT_TIMESTAMP " +
           "WHERE id = :requestId")
    Mono<Integer> reviewVerificationRequest(
            @Param("requestId") Integer requestId,
            @Param("status") String status,
            @Param("adminNote") String adminNote);

    /**
     * Create organization members for a list of users
     * Note: This uses a batch insert approach
     * @param organizationId The organization ID
     * @param userId The user ID to add to organization
        * @param graduatedYear Graduated year
        * @param graduationStatus Graduation status
        * @param program Training program
        * @param major Major
     * @param verificationLevel The verification level (default 0)
     * @param status The member status (default 'active')
     * @return Mono of created member ID
     */
    @Modifying
       @Query("INSERT INTO organization_members (organization_id, user_id, graduated_year, graduation_status, program, major, verification_level, is_trusted_verifier, status, created_at, updated_at) " +
                 "VALUES (:organizationId, :userId, :graduatedYear, :graduationStatus, :program, :major, :verificationLevel, false, :status, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)")
    Mono<Integer> createOrganizationMember(
        @Param("organizationId") Integer organizationId,
        @Param("userId") Integer userId,
              @Param("graduatedYear") Integer graduatedYear,
              @Param("graduationStatus") String graduationStatus,
              @Param("program") String program,
              @Param("major") String major,
        @Param("verificationLevel") Integer verificationLevel,
        @Param("status") String status
    );

    @Query("SELECT ulh.id, ulh.user_id, ulh.login_at, ulh.login_method, ulh.login_ip, ulh.user_agent, " +
           "u.email, u.user_name " +
           "FROM user_login_histories ulh " +
           "INNER JOIN users u ON ulh.user_id = u.id " +
           "WHERE ulh.user_id = :userId " +
           "ORDER BY ulh.login_at DESC " +
           "LIMIT :limit")
    Flux<LoginHistoryResponse> findRecentLoginHistories(@Param("userId") Integer userId, @Param("limit") int limit);

    @Query("SELECT id, member_id, document_url, document_type, status, admin_note, reviewed_by_member_id, created_at, updated_at " +
           "FROM verification_requests WHERE member_id = :userId ORDER BY created_at DESC LIMIT :limit")
    Flux<Object> findRecentVerificationRequests(@Param("userId") Integer userId, @Param("limit") int limit);

    @Modifying
    @Query("UPDATE users SET password_hash = :passwordHash, updated_at = CURRENT_TIMESTAMP WHERE id = :userId")
    Mono<Integer> resetPasswordByAdmin(@Param("userId") Integer userId, @Param("passwordHash") String passwordHash);

    @Query("SELECT EXISTS(SELECT 1 FROM users WHERE email = :email OR user_name = :userName)")
    Mono<Boolean> existsByEmailOrUserName(@Param("email") String email, @Param("userName") String userName);

    @Query("INSERT INTO users (email, user_name, password_hash, role, status, created_at, updated_at) " +
           "VALUES (:email, :userName, :passwordHash, 'ADMIN', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) " +
           "RETURNING id")
    Mono<Integer> createAdminUser(
            @Param("email") String email,
            @Param("userName") String userName,
            @Param("passwordHash") String passwordHash);

    @Modifying
    @Query("INSERT INTO global_profiles (user_id, full_name, updated_at) " +
           "VALUES (:userId, :fullName, CURRENT_TIMESTAMP)")
    Mono<Void> createGlobalProfile(@Param("userId") Integer userId, @Param("fullName") String fullName);

    @Modifying
    @Query("""
            INSERT INTO global_profiles (user_id, full_name, updated_at)
            VALUES (:userId, :fullName, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id) DO UPDATE SET
                full_name = EXCLUDED.full_name,
                updated_at = CURRENT_TIMESTAMP
            """)
    Mono<Integer> upsertGlobalProfileFullName(@Param("userId") Integer userId, @Param("fullName") String fullName);

    @Query("SELECT id FROM organization_members WHERE user_id = :userId ORDER BY id ASC LIMIT 1")
    Mono<Integer> findFirstOrganizationMemberIdByUserId(@Param("userId") Integer userId);

    @Modifying
    @Query("UPDATE organization_members SET organization_id = :organizationId, updated_at = CURRENT_TIMESTAMP "
            + "WHERE id = :memberId")
    Mono<Integer> updateOrganizationMemberOrganization(
            @Param("memberId") Integer memberId,
            @Param("organizationId") Integer organizationId);
}
