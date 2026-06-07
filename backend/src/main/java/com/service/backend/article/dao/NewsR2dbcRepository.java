package com.service.backend.article.dao;

import com.service.backend.shared.entity.News;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface NewsR2dbcRepository extends ReactiveCrudRepository<News, Integer> {

    @Query("SELECT * FROM news WHERE organization_id = :organizationId ORDER BY published_at DESC LIMIT :limit OFFSET :offset")
    Flux<News> findByOrganizationIdWithPagination(Integer organizationId, int limit, int offset);

    @Query("SELECT COUNT(*) FROM news WHERE organization_id = :organizationId")
    Mono<Long> countByOrganizationId(Integer organizationId);

    @Query("SELECT * FROM news ORDER BY published_at DESC LIMIT :limit OFFSET :offset")
    Flux<News> findAllWithPagination(int limit, int offset);

    @Query("SELECT * FROM news WHERE organization_id = :organizationId AND is_hidden = false ORDER BY published_at DESC LIMIT :limit OFFSET :offset")
    Flux<News> findPublishedByOrganizationId(Integer organizationId, int limit, int offset);

    @Query("SELECT COUNT(*) FROM news WHERE organization_id = :organizationId AND is_hidden = false")
    Mono<Long> countPublishedByOrganizationId(Integer organizationId);

    @Query("SELECT * FROM news WHERE organization_id = :organizationId AND (LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(content) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND is_hidden = false ORDER BY published_at DESC LIMIT :limit OFFSET :offset")
    Flux<News> searchNews(Integer organizationId, String keyword, int limit, int offset);

    @Query("SELECT COUNT(*) FROM news WHERE organization_id = :organizationId AND (LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(content) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND is_hidden = false")
    Mono<Long> countSearchNews(Integer organizationId, String keyword);

    Mono<News> findBySlug(String slug);

    @Modifying
    @Query("UPDATE news SET is_hidden = false, published_at = CURRENT_TIMESTAMP WHERE id = :id")
    Mono<Integer> publishNews(Integer id);

    @Modifying
    @Query("UPDATE news SET is_hidden = true WHERE id = :id")
    Mono<Integer> hideNews(Integer id);

    @Query("SELECT COUNT(*) FROM news WHERE published_at >= :since")
    Mono<Long> countSince(java.time.LocalDateTime since);
}
