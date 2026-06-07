package com.service.backend.user.dao;

import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.service.backend.shared.entity.OrganizationMember;

import reactor.core.publisher.Mono;

@Repository
public interface UserOrganizationMemberRepository extends R2dbcRepository<OrganizationMember, Integer> {

    @Query("SELECT * FROM organization_members WHERE organization_id = :organizationId AND user_id = :userId")
    Mono<OrganizationMember> findByOrganizationIdAndUserId(@Param("organizationId") Integer organizationId, @Param("userId") Integer userId);

    @Query("SELECT * FROM organization_members WHERE user_id = :userId")
    Mono<OrganizationMember> findByUserId(@Param("userId") Integer userId);

    @Modifying
    @Query("""
            UPDATE organization_members
            SET program = COALESCE(CAST(:program AS jsonb), program),
                started_year = COALESCE(CAST(:startedYear AS jsonb), started_year),
                graduated_year = COALESCE(CAST(:graduatedYear AS jsonb), graduated_year),
                graduation_status = COALESCE(CAST(:graduationStatus AS jsonb), graduation_status),
                major = COALESCE(CAST(:major AS jsonb), major),
                faculty = COALESCE(CAST(:faculty AS jsonb), faculty),
                department = COALESCE(CAST(:department AS jsonb), department),
                updated_at = CURRENT_TIMESTAMP
            WHERE organization_id = :organizationId AND user_id = :userId
            """)
    Mono<Integer> updateAcademicProfileByOrganizationAndUserId(
            @Param("organizationId") Integer organizationId,
            @Param("userId") Integer userId,
            @Param("program") String program,
            @Param("startedYear") String startedYear,
            @Param("graduatedYear") String graduatedYear,
            @Param("graduationStatus") String graduationStatus,
            @Param("major") String major,
            @Param("faculty") String faculty,
            @Param("department") String department);

    @Modifying
    @Query("""
            UPDATE organization_members
            SET verification_level = 2,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = :userId
            """)
    Mono<Integer> incrementVerificationLevelByUserId(@Param("userId") Integer userId);
}
