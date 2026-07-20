package com.service.backend.article.dao;

import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.service.backend.shared.entity.NewsComment;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface NewsCommentRepository extends R2dbcRepository<NewsComment, Integer> {

    @Query("SELECT * FROM news_comments WHERE news_id = :newsId AND is_hidden = false ORDER BY created_at ASC LIMIT :limit OFFSET :offset")
    Flux<NewsComment> findByNewsIdWithPagination(
            @Param("newsId") Integer newsId,
            @Param("limit") int limit,
            @Param("offset") long offset
    );

    @Query("SELECT COUNT(*) FROM news_comments WHERE news_id = :newsId AND is_hidden = false")
    Mono<Long> countByNewsId(@Param("newsId") Integer newsId);
}
