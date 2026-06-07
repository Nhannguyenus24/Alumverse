package com.service.backend.organization.dao;

import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;

import com.service.backend.shared.entity.SchoolFeedback;

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

    @Query("SELECT COUNT(*) FROM school_feedbacks WHERE is_read = false")
    Mono<Long> countUnread();

    @Query("SELECT CAST(created_at AS DATE) AS date, COUNT(*) AS count " +
           "FROM school_feedbacks " +
           "WHERE created_at >= CURRENT_DATE - INTERVAL '30 days' " +
           "GROUP BY CAST(created_at AS DATE) " +
           "ORDER BY date")
    Flux<com.service.backend.shared.projection.DailyCountProjection> getDailyFeedbackCounts();
}
