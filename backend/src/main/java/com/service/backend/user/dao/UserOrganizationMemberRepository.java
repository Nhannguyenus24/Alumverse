package com.service.backend.user.dao;

import java.util.Collection;

import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.service.backend.shared.entity.OrganizationMember;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface UserOrganizationMemberRepository extends R2dbcRepository<OrganizationMember, Integer> {

    public record PrimaryOrg(
            Integer userId,
            Integer organizationId,
            String organizationName,
            String studentId,
            Integer verificationLevel,
            Boolean isTrustedVerifier,
            String membershipStatus,
            String startedYear,
            String graduatedYear,
            String graduationStatus,
            String program,
            String major
    ) {}
    public record MemberIdentity(Integer memberId, String studentId, String fullName) {}

    @Query("""
            SELECT om.user_id,
                   om.organization_id,
                   o.name AS organization_name,
                   om.student_id,
                   om.verification_level,
                   om.is_trusted_verifier,
                   CAST(om."status" AS text) AS membership_status,
                   CAST(om.started_year AS text) AS started_year,
                   CAST(om.graduated_year AS text) AS graduated_year,
                   CAST(om.graduation_status AS text) AS graduation_status,
                   CAST(om.program AS text) AS program,
                   CAST(om.major AS text) AS major
            FROM organization_members om
            LEFT JOIN organizations o ON o.id = om.organization_id
            WHERE om.user_id IN (:userIds)
            ORDER BY om.user_id ASC, om.id ASC
            """)
    Flux<PrimaryOrg> findPrimaryOrgByUserIds(@Param("userIds") Collection<Integer> userIds);

    @Query("SELECT * FROM organization_members WHERE organization_id = :organizationId AND user_id = :userId")
    Mono<OrganizationMember> findByOrganizationIdAndUserId(@Param("organizationId") Integer organizationId, @Param("userId") Integer userId);

    @Query("SELECT * FROM organization_members WHERE user_id = :userId")
    Mono<OrganizationMember> findByUserId(@Param("userId") Integer userId);

    @Query("""
            SELECT om.id AS member_id, om.student_id, u.full_name
            FROM organization_members om
            LEFT JOIN users u ON u.id = om.user_id
            WHERE om.id = :memberId
            """)
    Mono<MemberIdentity> findIdentityByMemberId(@Param("memberId") Integer memberId);

    @Modifying
    @Query("""
            INSERT INTO organization_members (
                organization_id, user_id, student_id, started_year, graduated_year,
                graduation_status, program, major, verification_level, is_trusted_verifier,
                "status", created_at, updated_at)
            VALUES (
                :organizationId, :userId, :studentId, CAST(:startedYear AS jsonb),
                CAST(:graduatedYear AS jsonb), CAST(:graduationStatus AS jsonb),
                CAST(:program AS jsonb), CAST(:major AS jsonb), 0, false, 'ACTIVE',
                CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (organization_id, user_id) DO UPDATE SET
                student_id = COALESCE(EXCLUDED.student_id, organization_members.student_id),
                started_year = COALESCE(EXCLUDED.started_year, organization_members.started_year),
                graduated_year = COALESCE(EXCLUDED.graduated_year, organization_members.graduated_year),
                graduation_status = COALESCE(EXCLUDED.graduation_status, organization_members.graduation_status),
                program = COALESCE(EXCLUDED.program, organization_members.program),
                major = COALESCE(EXCLUDED.major, organization_members.major),
                updated_at = CURRENT_TIMESTAMP
            """)
    Mono<Integer> upsertSelfRegistration(
            @Param("organizationId") Integer organizationId,
            @Param("userId") Integer userId,
            @Param("studentId") String studentId,
            @Param("startedYear") String startedYear,
            @Param("graduatedYear") String graduatedYear,
            @Param("graduationStatus") String graduationStatus,
            @Param("program") String program,
            @Param("major") String major);

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
            SET program = COALESCE(CAST(:program AS jsonb), program),
                started_year = COALESCE(CAST(:startedYear AS jsonb), started_year),
                graduated_year = COALESCE(CAST(:graduatedYear AS jsonb), graduated_year),
                graduation_status = COALESCE(CAST(:graduationStatus AS jsonb), graduation_status),
                major = COALESCE(CAST(:major AS jsonb), major),
                faculty = COALESCE(CAST(:faculty AS jsonb), faculty),
                department = COALESCE(CAST(:department AS jsonb), department),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :memberId
            """)
    Mono<Integer> updateAcademicProfileByMemberId(
            @Param("memberId") Integer memberId,
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

    @Modifying
    @Query("""
            UPDATE organization_members
            SET verification_level = :level,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = :userId
            """)
    Mono<Integer> updateVerificationLevel(@Param("userId") Integer userId, @Param("level") Integer level);

    // Org-scoped variants: một user có thể thuộc nhiều tổ chức nên phải xác định
    // thành viên theo cặp (organization_id, user_id).
    @Modifying
    @Query("""
            UPDATE organization_members
            SET verification_level = 2,
                updated_at = CURRENT_TIMESTAMP
            WHERE organization_id = :organizationId AND user_id = :userId
            """)
    Mono<Integer> incrementVerificationLevelByOrgAndUser(@Param("organizationId") Integer organizationId, @Param("userId") Integer userId);

    @Modifying
    @Query("""
            UPDATE organization_members
            SET verification_level = :level,
                updated_at = CURRENT_TIMESTAMP
            WHERE organization_id = :organizationId AND user_id = :userId
            """)
    Mono<Integer> updateVerificationLevelByOrgAndUser(@Param("organizationId") Integer organizationId, @Param("userId") Integer userId, @Param("level") Integer level);
}
