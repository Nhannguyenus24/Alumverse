package com.service.backend.forum.dao;

import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.service.backend.forum.entity.ForumPostReport;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface ForumPostReportRepository extends R2dbcRepository<ForumPostReport, Long> {
    @Query("SELECT * FROM forum_post_reports WHERE status = :status ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<ForumPostReport> findByStatusWithPagination(@Param("status") String status, @Param("limit") int limit, @Param("offset") long offset);

    @Query("SELECT COUNT(*) FROM forum_post_reports WHERE status = :status")
    Mono<Long> countByStatus(@Param("status") String status);
}
