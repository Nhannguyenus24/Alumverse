package com.service.backend.organization.dao;

import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;

import com.service.backend.organization.entity.SchoolFeedback;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface SchoolFeedbackRepository extends R2dbcRepository<SchoolFeedback, Integer> {

    @Query("""
            SELECT * FROM school_feedbacks
            WHERE (:organizationId IS NULL OR organization_id = :organizationId)
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset
            """)
    Flux<SchoolFeedback> findByOrganizationIdWithPagination(Integer organizationId, int offset, int limit);

    @Query("""
            SELECT COUNT(*) FROM school_feedbacks
            WHERE (:organizationId IS NULL OR organization_id = :organizationId)
            """)
    Mono<Long> countByOrganizationId(Integer organizationId);

    @Modifying
    @Query("UPDATE school_feedbacks SET is_read = true WHERE id = :feedbackId")
    Mono<Integer> markAsRead(Integer feedbackId);
}
