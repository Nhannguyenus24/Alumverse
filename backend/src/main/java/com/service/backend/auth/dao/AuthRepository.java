package com.service.backend.auth.dao;

import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.service.backend.shared.entity.User;

import reactor.core.publisher.Mono;

@Repository
public interface AuthRepository extends R2dbcRepository<User, Integer> {
    
    /**
     * Find user by email
     */
    Mono<User> findByEmail(String email);
    
    /**
     * Update user password by id
     */
    @Modifying
    @Query("UPDATE users SET password_hash = :passwordHash, must_change_password = false, updated_at = CURRENT_TIMESTAMP WHERE id = :id")
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
     * Update user cover by id
     */
    @Modifying
    @Query("UPDATE users SET cover_url = :coverUrl, updated_at = CURRENT_TIMESTAMP WHERE id = :id")
    Mono<Void> updateCoverById(@Param("id") Integer id, @Param("coverUrl") String coverUrl);
    
    /**
     * Update user status to active after successful verification
     */
    @Modifying
    @Query("UPDATE users SET \"status\" = 'ACTIVE', updated_at = CURRENT_TIMESTAMP WHERE id = :id")
    Mono<Void> activateUserById(@Param("id") Integer id);

    /**
     * Register new user with unverified status and default USER role
     * Returns the created user ID
     */
    @Query("INSERT INTO users (email, password_hash, role, \"status\", full_name, created_at, updated_at) " +
           "VALUES (:email, :passwordHash, 'USER', 'UNVERIFIED', :fullName, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) " +
           "RETURNING id")
    Mono<Integer> registerNewUser(@Param("email") String email, @Param("passwordHash") String passwordHash, @Param("fullName") String fullName);

    /**
     * Register new user from Google login with active status
     * Returns the created User object
     */
    @Query("INSERT INTO users (email, password_hash, role, \"status\", avatar_url, full_name, created_at, updated_at) " +
           "VALUES (:email, :passwordHash, 'USER', 'ACTIVE', :avatarUrl, :fullName, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) " +
           "RETURNING *")
    Mono<User> registerGoogleUser(
            @Param("email") String email,
            @Param("passwordHash") String passwordHash,
            @Param("avatarUrl") String avatarUrl,
            @Param("fullName") String fullName);

    /**
     * Create a default organization_members record when a user registers under an organization
     */
    @Modifying
    @Query("INSERT INTO organization_members (organization_id, user_id, verification_level, is_trusted_verifier, \"status\", created_at, updated_at) " +
           "VALUES (:organizationId, :userId, 0, false, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)")
    Mono<Void> createOrganizationMember(@Param("organizationId") Integer organizationId, @Param("userId") Integer userId);

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

    @Query("INSERT INTO verification_requests (organization_id, member_id, document_url, document_type, \"status\", created_at, updated_at) " +
           "VALUES (:organizationId, :userId, :documentUrl, :documentType, 'PENDING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) " +
           "RETURNING id")
    Mono<Integer> insertVerificationRequest(
            @Param("organizationId") Integer organizationId,
            @Param("userId") Integer userId,
            @Param("documentUrl") String documentUrl,
            @Param("documentType") String documentType);

    @Modifying
    @Query("UPDATE verification_requests SET ai_summary = :aiSummary, updated_at = CURRENT_TIMESTAMP WHERE id = :id")
    Mono<Void> updateAiSummary(@Param("id") Integer id, @Param("aiSummary") String aiSummary);

    @Modifying
    @Query("UPDATE verification_requests SET document_url = :documentUrl, document_type = :documentType, ai_summary = :aiSummary, updated_at = CURRENT_TIMESTAMP WHERE id = :id")
    Mono<Void> updateVerificationDocumentAndAiSummary(
            @Param("id") Integer id,
            @Param("documentUrl") String documentUrl,
            @Param("documentType") String documentType,
            @Param("aiSummary") String aiSummary);
}
