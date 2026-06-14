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

    @Query("SELECT fpr.* FROM forum_post_reports fpr " +
           "JOIN forum_posts fp ON fpr.post_id = fp.id " +
           "JOIN forum_topics ft ON fp.topic_id = ft.id " +
           "WHERE ft.organization_id = :organizationId AND fpr.status = :status " +
           "ORDER BY fpr.created_at DESC LIMIT :limit OFFSET :offset")
    Flux<ForumPostReport> findByOrganizationAndStatusWithPagination(
            @Param("organizationId") Integer organizationId,
            @Param("status") Status status,
            @Param("limit") int limit,
            @Param("offset") long offset);

    @Query("SELECT COUNT(*) FROM forum_post_reports fpr " +
           "JOIN forum_posts fp ON fpr.post_id = fp.id " +
           "JOIN forum_topics ft ON fp.topic_id = ft.id " +
           "WHERE ft.organization_id = :organizationId AND fpr.status = :status")
    Mono<Long> countByOrganizationAndStatus(@Param("organizationId") Integer organizationId,
                                             @Param("status") Status status);
}
