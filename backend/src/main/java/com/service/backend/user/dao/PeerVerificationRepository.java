package com.service.backend.user.dao;

import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;

import com.service.backend.user.entity.PeerVerification;

import reactor.core.publisher.Mono;

@Repository
public interface PeerVerificationRepository extends R2dbcRepository<PeerVerification, Integer> {
    
    @Modifying
    @Query("UPDATE peer_verifications SET status = :status WHERE id = :id")
    Mono<Integer> updateStatus(Integer id, String status);

    @Query("SELECT * FROM peer_verifications WHERE target_member_id = :targetMemberId AND verifier_member_id = :verifierMemberId AND status = 'pending'")
    Mono<PeerVerification> findPendingRequest(Integer targetMemberId, Integer verifierMemberId);
}
