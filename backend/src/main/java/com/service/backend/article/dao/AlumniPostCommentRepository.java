package com.service.backend.article.dao;

import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.service.backend.shared.entity.AlumniPostComment;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface AlumniPostCommentRepository extends R2dbcRepository<AlumniPostComment, Integer> {

    @Query("SELECT * FROM alumni_post_comments WHERE alumni_post_id = :alumniPostId AND is_hidden = false ORDER BY created_at ASC LIMIT :limit OFFSET :offset")
    Flux<AlumniPostComment> findByAlumniPostIdWithPagination(
            @Param("alumniPostId") Integer alumniPostId,
            @Param("limit") int limit,
            @Param("offset") long offset
    );

    @Query("SELECT COUNT(*) FROM alumni_post_comments WHERE alumni_post_id = :alumniPostId AND is_hidden = false")
    Mono<Long> countByAlumniPostId(@Param("alumniPostId") Integer alumniPostId);
}
