package com.service.backend.article.dao;

import com.service.backend.article.dto.NewsListItemResponse;
import com.service.backend.shared.entity.News;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface NewsR2dbcRepository extends R2dbcRepository<News, Integer> {

    String PUBLIC_LIST_COLUMNS = "id, organization_id, author_member_id, title, slug, "
            + "content, thumbnail_url, topic, url, is_hidden, created_at, updated_at ";

    String FIND_PUBLISHED_FEATURED_QUERY = "SELECT " + PUBLIC_LIST_COLUMNS + """
            FROM news
            WHERE organization_id = :organizationId
              AND is_hidden = false
            ORDER BY created_at DESC, id DESC
            LIMIT 1
            """;

    String FIND_PUBLISHED_LIST_QUERY = "SELECT " + PUBLIC_LIST_COLUMNS + """
            FROM news
            WHERE organization_id = :organizationId
              AND is_hidden = false
              AND id <> :featuredId
              AND (:keyword = ''
                   OR POSITION(LOWER(:keyword) IN LOWER(COALESCE(title, ''))) > 0
                   OR POSITION(LOWER(:keyword) IN LOWER(COALESCE(content, ''))) > 0)
              AND (:topicsCsv = '' OR LOWER(REPLACE(topic, '-', '_')) = ANY(STRING_TO_ARRAY(:topicsCsv, ',')))
              AND (:fromDate = '' OR CAST(COALESCE(updated_at, created_at) AS date) >= CAST(NULLIF(:fromDate, '') AS date))
              AND (:toDate = '' OR CAST(COALESCE(updated_at, created_at) AS date) <= CAST(NULLIF(:toDate, '') AS date))
            ORDER BY
              CASE WHEN :sort = 'oldest' THEN COALESCE(updated_at, created_at) END ASC,
              CASE WHEN :sort = 'newest' THEN COALESCE(updated_at, created_at) END DESC,
              CASE WHEN :sort = 'oldest' THEN id END ASC,
              CASE WHEN :sort = 'newest' THEN id END DESC
            LIMIT :limit OFFSET :offset
            """;

    @Query("SELECT * FROM news WHERE organization_id = :organizationId ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<News> findByOrganizationIdWithPagination(Integer organizationId, int limit, int offset);

    @Query("SELECT COUNT(*) FROM news WHERE organization_id = :organizationId")
    Mono<Long> countByOrganizationId(Integer organizationId);

    @Query("SELECT * FROM news ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<News> findAllWithPagination(int limit, int offset);

    @Query("SELECT * FROM news WHERE LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%')) ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<News> searchAllByTitleWithPagination(String keyword, int limit, int offset);

    @Query("SELECT COUNT(*) FROM news WHERE LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Mono<Long> countAllSearchByTitle(String keyword);

    @Query("SELECT * FROM news WHERE organization_id = :organizationId AND is_hidden = false ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<News> findPublishedByOrganizationId(Integer organizationId, int limit, int offset);

    @Query("SELECT COUNT(*) FROM news WHERE organization_id = :organizationId AND is_hidden = false")
    Mono<Long> countPublishedByOrganizationId(Integer organizationId);

    @Query(FIND_PUBLISHED_FEATURED_QUERY)
    Mono<NewsListItemResponse> findPublishedFeatured(Integer organizationId);

    @Query(FIND_PUBLISHED_LIST_QUERY)
    Flux<NewsListItemResponse> findPublishedList(
            Integer organizationId,
            Integer featuredId,
            String keyword,
            String topicsCsv,
            String fromDate,
            String toDate,
            String sort,
            int limit,
            int offset);

    @Query("""
            SELECT COUNT(*)
            FROM news
            WHERE organization_id = :organizationId
              AND is_hidden = false
              AND id <> :featuredId
              AND (:keyword = ''
                   OR POSITION(LOWER(:keyword) IN LOWER(COALESCE(title, ''))) > 0
                   OR POSITION(LOWER(:keyword) IN LOWER(COALESCE(content, ''))) > 0)
              AND (:topicsCsv = '' OR LOWER(REPLACE(topic, '-', '_')) = ANY(STRING_TO_ARRAY(:topicsCsv, ',')))
              AND (:fromDate = '' OR CAST(COALESCE(updated_at, created_at) AS date) >= CAST(NULLIF(:fromDate, '') AS date))
              AND (:toDate = '' OR CAST(COALESCE(updated_at, created_at) AS date) <= CAST(NULLIF(:toDate, '') AS date))
            """)
    Mono<Long> countPublishedList(
            Integer organizationId,
            Integer featuredId,
            String keyword,
            String topicsCsv,
            String fromDate,
            String toDate);

    @Query("SELECT * FROM news WHERE organization_id = :organizationId AND (LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(content) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND is_hidden = false ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<News> searchNews(Integer organizationId, String keyword, int limit, int offset);

    @Query("SELECT COUNT(*) FROM news WHERE organization_id = :organizationId AND (LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(content) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND is_hidden = false")
    Mono<Long> countSearchNews(Integer organizationId, String keyword);

    Mono<News> findBySlug(String slug);

    @Modifying
    @Query("UPDATE news SET is_hidden = false, updated_at = CURRENT_TIMESTAMP WHERE id = :id")
    Mono<Integer> publishNews(Integer id);

    @Modifying
    @Query("UPDATE news SET is_hidden = true, updated_at = CURRENT_TIMESTAMP WHERE id = :id")
    Mono<Integer> hideNews(Integer id);

    @Query("SELECT COUNT(*) FROM news WHERE created_at >= :since")
    Mono<Long> countSince(java.time.LocalDateTime since);
}
