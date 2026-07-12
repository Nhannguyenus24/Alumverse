package com.service.backend.user.dao;

import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.service.backend.shared.entity.PeerVerification;
import com.service.backend.shared.enums.Status;
import com.service.backend.user.dto.PendingPeerVerificationResponse;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface PeerVerificationRepository extends R2dbcRepository<PeerVerification, Integer> {
    
    @Modifying
    @Query("UPDATE peer_verifications SET \"status\" = :status WHERE id = :id")
    Mono<Integer> updateStatus(@Param("id") Integer id, @Param("status") Status status);

    @Modifying
    @Query("""
        UPDATE peer_verifications
        SET "status" = :status
        WHERE organization_id = :organizationId
          AND target_member_id = :targetMemberId
          AND "status" = 'PENDING'
          AND id <> :acceptedRequestId
    """)
    Mono<Integer> resolveOtherPendingRequestsForTarget(
            @Param("organizationId") Integer organizationId,
            @Param("targetMemberId") Integer targetMemberId,
            @Param("acceptedRequestId") Integer acceptedRequestId,
            @Param("status") Status status);

    @Modifying
    @Query("""
        UPDATE peer_verifications
        SET "status" = :status
        WHERE organization_id = :organizationId
          AND target_member_id = :targetMemberId
          AND "status" = 'PENDING'
    """)
    Mono<Integer> markPendingRequestsForTarget(
            @Param("organizationId") Integer organizationId,
            @Param("targetMemberId") Integer targetMemberId,
            @Param("status") Status status);

    @Query("SELECT * FROM peer_verifications WHERE \"organization_id\" = :organizationId AND \"target_member_id\" = :targetMemberId AND \"verifier_member_id\" = :verifierMemberId AND \"status\" = 'PENDING'")
    Mono<PeerVerification> findPendingRequest(@Param("organizationId") Integer organizationId, @Param("targetMemberId") Integer targetMemberId, @Param("verifierMemberId") Integer verifierMemberId);

    /**
     * Member IDs the given member has a peer-verification relationship with, either as the
     * requester (target) or the chosen verifier, regardless of status. Used to grant chat
     * access to the specific counterpart(s) picked during verification, without waiting for
     * verification_level to reach the general contribute threshold.
     */
    @Query("""
        SELECT verifier_member_id AS member_id FROM peer_verifications
        WHERE organization_id = :organizationId AND target_member_id = :memberId
        UNION
        SELECT target_member_id AS member_id FROM peer_verifications
        WHERE organization_id = :organizationId AND verifier_member_id = :memberId
    """)
    Flux<Integer> findCounterpartMemberIds(@Param("organizationId") Integer organizationId, @Param("memberId") Integer memberId);

    @Query("""
        SELECT pv.id as request_id,
               om_target.user_id as requester_user_id,
               gp.full_name as requester_name,
               pv.organization_id as organization_id,
               pv.created_at as created_at
        FROM peer_verifications pv
        JOIN organization_members om_target ON pv.target_member_id = om_target.user_id AND pv.organization_id = om_target.organization_id
        JOIN users gp ON gp.id = om_target.user_id
        WHERE pv.verifier_member_id = :verifierUserId AND pv.organization_id = :organizationId AND pv."status" = 'PENDING'
        ORDER BY pv.created_at DESC
    """)
    Flux<PendingPeerVerificationResponse> findPendingRequestsByVerifierMemberId(@Param("organizationId") Integer organizationId, @Param("verifierUserId") Integer verifierUserId);
}
