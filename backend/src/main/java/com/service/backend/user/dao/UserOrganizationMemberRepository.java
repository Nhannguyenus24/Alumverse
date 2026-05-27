package com.service.backend.user.dao;

import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;

import com.service.backend.admin.entity.OrganizationMember;

import reactor.core.publisher.Mono;

@Repository
public interface UserOrganizationMemberRepository extends R2dbcRepository<OrganizationMember, Integer> {

    @Query("SELECT * FROM organization_members WHERE organization_id = :organizationId AND user_id = :userId")
    Mono<OrganizationMember> findByOrganizationIdAndUserId(Integer organizationId, Integer userId);

    @Modifying
    @Query("""
            UPDATE organization_members
            SET program = COALESCE(CAST(:program AS jsonb), program),
                graduated_year = COALESCE(CAST(:graduatedYear AS jsonb), graduated_year),
                graduation_status = COALESCE(CAST(:graduationStatus AS jsonb), graduation_status),
                major = COALESCE(CAST(:major AS jsonb), major),
                updated_at = CURRENT_TIMESTAMP
            WHERE organization_id = :organizationId AND user_id = :userId
            """)
    Mono<Integer> updateAcademicProfileByOrganizationAndUserId(
            Integer organizationId,
            Integer userId,
            String program,
            String graduatedYear,
            String graduationStatus,
            String major);
}
