package com.service.backend.user.dao;

import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.service.backend.auth.entity.User;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Repository for user operations including profile and organization membership
 */
@Repository
public interface UserRepository extends R2dbcRepository<User, Integer> {
    
    /**
     * Find user by ID - if not found, returns empty Mono
     */
    @Query("""
        SELECT u.* FROM users u
        WHERE u.id = :userId
    """)
    Mono<User> findUserById(@Param("userId") Integer userId);
    
    /**
     * Get user profile including global profile data
     * Returns a map/row with both user and global_profile information
     */
    @Query("""
        SELECT 
            u.id, u.email, u.user_name, u.status, u.role, u.avatar_url, u.created_at, u.updated_at,
            gp.full_name, gp.phone, gp.bio
        FROM users u
        LEFT JOIN global_profiles gp ON u.id = gp.user_id
        WHERE u.id = :userId
    """)
    Mono<UserProfileView> findUserProfile(@Param("userId") Integer userId);
    
    /**
     * Get all organizations that user is member of
     */
    @Query("""
        SELECT 
            om.id, om.organization_id, om.user_id, om.verification_level, 
            om.is_trusted_verifier, om.status, om.created_at, om.updated_at,
            o.name as organization_name, o.slug as organization_slug, o.logo_url as organization_logo_url
        FROM organization_members om
        JOIN organizations o ON om.organization_id = o.id
        WHERE om.user_id = :userId AND om.status = 'active'
    """)
    Flux<OrganizationMembershipView> findUserOrganizations(@Param("userId") Integer userId);
    
    /**
     * Check if user is already member of an organization
     */
    @Query("""
        SELECT COUNT(*) FROM organization_members
        WHERE user_id = :userId AND organization_id = :organizationId
    """)
    Mono<Long> countMembershipByUserAndOrg(@Param("userId") Integer userId, @Param("organizationId") Integer organizationId);
    
    /**
     * Get single organization membership details
     */
    @Query("""
        SELECT 
            om.id, om.organization_id, om.user_id, om.verification_level,
            om.is_trusted_verifier, om.status, om.created_at, om.updated_at,
            o.name as organization_name, o.slug as organization_slug, o.logo_url as organization_logo_url
        FROM organization_members om
        JOIN organizations o ON om.organization_id = o.id
        WHERE om.user_id = :userId AND om.organization_id = :organizationId
    """)
    Mono<OrganizationMembershipView> findMembershipByUserAndOrg(@Param("userId") Integer userId, @Param("organizationId") Integer organizationId);
    
    interface UserProfileView {
        Integer getId();
        String getEmail();
        String getUserName();
        String getStatus();
        String getRole();
        String getAvatarUrl();
        java.time.LocalDateTime getCreatedAt();
        java.time.LocalDateTime getUpdatedAt();
        String getFullName();
        String getPhone();
        String getBio();
    }
    
    interface OrganizationMembershipView {
        Integer getId();
        Integer getOrganizationId();
        Integer getUserId();
        Integer getVerificationLevel();
        Boolean getIsTrustedVerifier();
        String getStatus();
        java.time.LocalDateTime getCreatedAt();
        java.time.LocalDateTime getUpdatedAt();
        String getOrganizationName();
        String getOrganizationSlug();
        String getOrganizationLogoUrl();
    }
}
