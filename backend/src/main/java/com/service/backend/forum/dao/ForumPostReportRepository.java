package com.service.backend.forum.dao;

import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.service.backend.shared.entity.ForumPostReport;
import com.service.backend.shared.enums.Status;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface ForumPostReportRepository extends R2dbcRepository<ForumPostReport, Long> {
    @Query("SELECT * FROM forum_post_reports WHERE status = :status ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<ForumPostReport> findByStatusWithPagination(@Param("status") Status status, @Param("limit") int limit, @Param("offset") long offset);

    Mono<Long> countByStatus(Status status);

    Mono<Long> countByPostId(Integer postId);

    @Query("SELECT reason, COUNT(*) as count FROM forum_post_reports GROUP BY reason")
    Flux<Object> countByReason();

    @Query("SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600) FROM forum_post_reports WHERE status != 'PENDING'")
    Mono<Double> getAverageResolutionTimeHours();

    @Query("""
        SELECT o.id as organization_id, o.name as organization_name, COUNT(fpr.id) as report_count
        FROM forum_post_reports fpr
        JOIN forum_posts fp ON fpr.post_id = fp.id
        JOIN forum_topics ft ON fp.topic_id = ft.id
        JOIN organizations o ON ft.organization_id = o.id
        GROUP BY o.id, o.name
        ORDER BY report_count DESC
        LIMIT :limit
    """)
    Flux<Object> findFlaggedOrganizations(@Param("limit") int limit);
}
