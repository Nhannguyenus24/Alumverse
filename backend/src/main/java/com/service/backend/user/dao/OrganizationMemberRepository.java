package com.service.backend.user.dao;

import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.service.backend.admin.entity.OrganizationMember;

import reactor.core.publisher.Mono;

/**
 * Repository for organization member operations
 */
@Repository
public interface OrganizationMemberRepository extends R2dbcRepository<OrganizationMember, Integer> {
    
    /**
     * Create organization member (add user to organization)
     * Returns the created member ID
     */
    @Modifying
    @Query("""
        INSERT INTO organization_members (organization_id, user_id, verification_level, is_trusted_verifier, status, created_at, updated_at)
        VALUES (:organizationId, :userId, 0, false, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id
    """)
    Mono<Integer> createMembership(
        @Param("organizationId") Integer organizationId,
        @Param("userId") Integer userId
    );
}
