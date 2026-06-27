package com.service.backend.auth.dao;

import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.service.backend.shared.entity.User;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface AuthRepository extends R2dbcRepository<User, Integer> {
    
    /**
     * Find user by email
     */
    Mono<User> findByEmail(String email);
    


    /**
     * Check if user exists by email
     */
    Mono<Boolean> existsByEmail(String email);



    /**
     * Find active user by email
     */
    @Query("SELECT * FROM users WHERE email = :email AND \"status\" = 'ACTIVE'")
    Mono<User> findActiveByEmail(@Param("email") String email);
    

    
    /**
     * Find user by email and password for login
     */
    @Query("SELECT * FROM users WHERE email = :email AND password_hash = :passwordHash")
    Mono<User> findByEmailAndPassword(@Param("email") String email, @Param("passwordHash") String passwordHash);
    

    
    /**
     * Update user password by id
     */
    @Modifying
    @Query("UPDATE users SET password_hash = :passwordHash, updated_at = CURRENT_TIMESTAMP WHERE id = :id")
    Mono<Void> updatePasswordById(@Param("id") Integer id, @Param("passwordHash") String passwordHash);
    
    /**
     * Update user email by id
     */
    @Modifying
    @Query("UPDATE users SET email = :email, updated_at = CURRENT_TIMESTAMP WHERE id = :id")
    Mono<Void> updateEmailById(@Param("id") Integer id, @Param("email") String email);
    
    /**
     * Update user avatar by id
     */
    @Modifying
    @Query("UPDATE users SET avatar_url = :avatarUrl, updated_at = CURRENT_TIMESTAMP WHERE id = :id")
    Mono<Void> updateAvatarById(@Param("id") Integer id, @Param("avatarUrl") String avatarUrl);
    
    /**
     * Update user status to active after successful verification
     */
    @Modifying
    @Query("UPDATE users SET \"status\" = 'ACTIVE', updated_at = CURRENT_TIMESTAMP WHERE id = :id")
    Mono<Void> activateUserById(@Param("id") Integer id);
    
    /**
     * Update user status to pending (for new registrations)
     */
    @Modifying
    @Query("UPDATE users SET \"status\" = 'PENDING', updated_at = CURRENT_TIMESTAMP WHERE id = :id")
    Mono<Void> updateStatusToPendingById(@Param("id") Integer id);
    
    /**
     * Update user status by id
     */
    @Modifying
    @Query("UPDATE users SET \"status\" = :status, updated_at = CURRENT_TIMESTAMP WHERE id = :id")
    Mono<Void> updateStatusById(@Param("id") Integer id, @Param("status") String status);
    
    /**
     * Find user by email (pending or active) for registration check
     */
    @Query("SELECT * FROM users WHERE email = :email AND (\"status\" = 'PENDING' OR \"status\" = 'ACTIVE')")
    Mono<User> findPendingOrActiveByEmail(@Param("email") String email);
    
    /**
     * Register new user with unverified status and default USER role
     * Returns the created user ID
     */
    @Query("INSERT INTO users (email, password_hash, role, \"status\", created_at, updated_at) " +
           "VALUES (:email, :passwordHash, 'USER', 'UNVERIFIED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) " +
           "RETURNING id")
    Mono<Integer> registerNewUser(@Param("email") String email, @Param("passwordHash") String passwordHash);

    /**
     * Register new user from Google login with active status
     * Returns the created user ID
     */
    @Query("INSERT INTO users (email, password_hash, role, \"status\", avatar_url, created_at, updated_at) " +
           "VALUES (:email, :passwordHash, 'USER', 'ACTIVE', :avatarUrl, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) " +
           "RETURNING id")
    Mono<Integer> registerGoogleUser(
            @Param("email") String email,
            @Param("passwordHash") String passwordHash,
            @Param("avatarUrl") String avatarUrl);
    
    /**
     * Get organization IDs for a user from organization_members table
     * Returns empty Flux if user is not a member of any organization
     */
    @Query("SELECT om.organization_id FROM organization_members om WHERE om.user_id = :userId")
    Flux<Integer> getOrganizationIdByUserId(@Param("userId") Integer userId);

    /**
     * Create global profile for a newly registered user
     */
    @Modifying
    @Query("INSERT INTO global_profiles (user_id, full_name, updated_at) " +
           "VALUES (:userId, :fullName, CURRENT_TIMESTAMP)")
    Mono<Void> createGlobalProfile(@Param("userId") Integer userId, @Param("fullName") String fullName);

    /**
     * Create a default organization_members record when a user registers under an organization
     */
    @Modifying
    @Query("INSERT INTO organization_members (organization_id, user_id, student_id, verification_level, is_trusted_verifier, \"status\", created_at, updated_at) " +
           "VALUES (:organizationId, :userId, :studentId, 0, false, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)")
    Mono<Void> createOrganizationMember(@Param("organizationId") Integer organizationId, @Param("userId") Integer userId, @Param("studentId") String studentId);

    /**
     * Check if an organization_members record exists for the given user and organization
     */
    @Query("SELECT COUNT(*) > 0 FROM organization_members WHERE user_id = :userId AND organization_id = :organizationId")
    Mono<Boolean> existsOrganizationMemberByUserIdAndOrgId(@Param("userId") Integer userId, @Param("organizationId") Integer organizationId);

    /**
     * Get verification level for a given user and organization
     */
    @Query("SELECT verification_level FROM organization_members WHERE user_id = :userId AND organization_id = :organizationId")
    Mono<Integer> getVerificationLevelByUserIdAndOrgId(@Param("userId") Integer userId, @Param("organizationId") Integer organizationId);

    @Query("INSERT INTO verification_requests (member_id, document_url, document_type, \"status\", created_at, updated_at) " +
           "VALUES (:userId, :documentUrl, :documentType, 'PENDING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) " +
           "RETURNING id")
    Mono<Integer> insertVerificationRequest(
            @Param("userId") Integer userId,
            @Param("documentUrl") String documentUrl,
            @Param("documentType") String documentType);

    @Modifying
    @Query("UPDATE verification_requests SET ai_summary = :aiSummary, updated_at = CURRENT_TIMESTAMP WHERE id = :id")
    Mono<Void> updateAiSummary(@Param("id") Integer id, @Param("aiSummary") String aiSummary);
}
