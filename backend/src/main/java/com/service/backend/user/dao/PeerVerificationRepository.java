package com.service.backend.user.dao;

import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.service.backend.user.entity.PeerVerification;
import com.service.backend.user.dto.PendingPeerVerificationResponse;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface PeerVerificationRepository extends R2dbcRepository<PeerVerification, Integer> {
    
    @Modifying
    @Query("UPDATE peer_verifications SET \"status\" = :status WHERE id = :id")
    Mono<Integer> updateStatus(@Param("id") Integer id, @Param("status") String status);

    @Query("SELECT * FROM peer_verifications WHERE \"target_member_id\" = :targetMemberId AND \"verifier_member_id\" = :verifierMemberId AND \"status\" = 'pending'")
    Mono<PeerVerification> findPendingRequest(@Param("targetMemberId") Integer targetMemberId, @Param("verifierMemberId") Integer verifierMemberId);

    @Query("""
        SELECT pv.id as request_id, 
               om_target.user_id as requester_user_id, 
               gp.full_name as requester_name, 
               om_target.organization_id as organization_id, 
               pv.created_at as created_at
        FROM peer_verifications pv
        JOIN organization_members om_target ON pv.target_member_id = om_target.user_id
        JOIN global_profiles gp ON om_target.user_id = gp.user_id
        WHERE pv.verifier_member_id = :verifierUserId AND pv."status" = 'pending'
        ORDER BY pv.created_at DESC
    """)
    Flux<PendingPeerVerificationResponse> findPendingRequestsByVerifierMemberId(@Param("verifierUserId") Integer verifierUserId);
}
