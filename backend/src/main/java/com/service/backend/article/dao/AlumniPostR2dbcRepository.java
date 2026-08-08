package com.service.backend.article.dao;

import com.service.backend.shared.entity.AlumniPost;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface AlumniPostR2dbcRepository extends R2dbcRepository<AlumniPost, Integer> {

    String PUBLIC_FILTER = """
            organization_id = :organizationId
              AND is_hidden = false
              AND (:keyword = ''
                   OR POSITION(LOWER(:keyword) IN LOWER(COALESCE(title, ''))) > 0
                   OR POSITION(LOWER(:keyword) IN LOWER(COALESCE(content, ''))) > 0)
              AND (:topicsCsv = '' OR LOWER(REPLACE(COALESCE(topic, ''), '-', '_')) = ANY(STRING_TO_ARRAY(:topicsCsv, ',')))
              AND (:fromDate = '' OR CAST(COALESCE(updated_at, created_at) AS date) >= CAST(NULLIF(:fromDate, '') AS date))
              AND (:toDate = '' OR CAST(COALESCE(updated_at, created_at) AS date) <= CAST(NULLIF(:toDate, '') AS date))
            """;

    /**
     * NULLS LAST on both date branches: a post with neither updated_at nor created_at is genuinely
     * dateless and must sort last, matching the client-side sort in articleListFilters.js which
     * mapped a missing date to 0. Postgres defaults DESC to NULLS FIRST, so without this such a row
     * floats to the top and can even be picked as the featured hero. It is safe on the inactive
     * branch too: a CASE whose condition is false yields NULL for every row, so that term ties
     * regardless of the null placement and the id tiebreakers (never NULL) still decide.
     *
     * Written as one text block on purpose: concatenating text blocks here silently drops the
     * whitespace at the seam and yields tokens like THENCOALESCE.
     */
    String PUBLIC_ORDER = """
            ORDER BY
              CASE WHEN :direction = 'oldest' THEN COALESCE(updated_at, created_at) END ASC NULLS LAST,
              CASE WHEN :direction = 'newest' THEN COALESCE(updated_at, created_at) END DESC NULLS LAST,
              CASE WHEN :direction = 'oldest' THEN id END ASC NULLS LAST,
              CASE WHEN :direction = 'newest' THEN id END DESC NULLS LAST
            """;

    @Query("SELECT * FROM alumni_posts WHERE " + PUBLIC_FILTER + PUBLIC_ORDER + " LIMIT 1")
    Mono<AlumniPost> findPublicFeatured(Integer organizationId, String keyword, String topicsCsv,
                                        String fromDate, String toDate, String direction);

    @Query("SELECT * FROM alumni_posts WHERE " + PUBLIC_FILTER
            + " AND (:featuredId IS NULL OR id <> :featuredId) " + PUBLIC_ORDER
            + " LIMIT :limit OFFSET :offset")
    Flux<AlumniPost> findPublicPage(Integer organizationId, Integer featuredId, String keyword,
                                    String topicsCsv, String fromDate, String toDate,
                                    String direction, int limit, int offset);

    @Query("SELECT COUNT(*) FROM alumni_posts WHERE " + PUBLIC_FILTER
            + " AND (:featuredId IS NULL OR id <> :featuredId)")
    Mono<Long> countPublicPage(Integer organizationId, Integer featuredId, String keyword,
                               String topicsCsv, String fromDate, String toDate);

    @Query("SELECT * FROM alumni_posts WHERE organization_id = :organizationId ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<AlumniPost> findByOrganizationIdWithPagination(Integer organizationId, int limit, int offset);

    @Query("SELECT * FROM alumni_posts WHERE author_member_id = :authorMemberId AND organization_id = :organizationId AND is_hidden = false ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<AlumniPost> findPublishedByAuthorMemberIdAndOrganizationId(Integer authorMemberId, Integer organizationId, int limit, int offset);

    @Query("SELECT COUNT(*) FROM alumni_posts WHERE author_member_id = :authorMemberId AND organization_id = :organizationId AND is_hidden = false")
    Mono<Long> countPublishedByAuthorMemberIdAndOrganizationId(Integer authorMemberId, Integer organizationId);

    @Query("SELECT COUNT(*) FROM alumni_posts WHERE organization_id = :organizationId")
    Mono<Long> countByOrganizationId(Integer organizationId);

    @Query("SELECT * FROM alumni_posts ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<AlumniPost> findAllWithPagination(int limit, int offset);

    @Query("SELECT * FROM alumni_posts WHERE LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%')) ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<AlumniPost> searchAllByTitleWithPagination(String keyword, int limit, int offset);

    @Query("SELECT COUNT(*) FROM alumni_posts WHERE LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Mono<Long> countAllSearchByTitle(String keyword);

    @Query("SELECT * FROM alumni_posts WHERE organization_id = :organizationId AND is_hidden = false ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<AlumniPost> findPublishedByOrganizationId(Integer organizationId, int limit, int offset);

    @Query("SELECT COUNT(*) FROM alumni_posts WHERE organization_id = :organizationId AND is_hidden = false")
    Mono<Long> countPublishedByOrganizationId(Integer organizationId);

    @Query("SELECT * FROM alumni_posts WHERE organization_id = :organizationId AND (LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(content) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND is_hidden = false ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<AlumniPost> searchAlumniPosts(Integer organizationId, String keyword, int limit, int offset);

    @Query("SELECT COUNT(*) FROM alumni_posts WHERE organization_id = :organizationId AND (LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(content) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND is_hidden = false")
    Mono<Long> countSearchAlumniPosts(Integer organizationId, String keyword);

    Mono<AlumniPost> findBySlug(String slug);

    @Modifying
    @Query("UPDATE alumni_posts SET is_hidden = false, updated_at = CURRENT_TIMESTAMP WHERE id = :id")
    Mono<Integer> publishAlumniPost(Integer id);

    @Modifying
    @Query("UPDATE alumni_posts SET is_hidden = true, updated_at = CURRENT_TIMESTAMP WHERE id = :id")
    Mono<Integer> hideAlumniPost(Integer id);

    @Query("SELECT COUNT(*) FROM alumni_posts WHERE created_at >= :since")
    Mono<Long> countSince(java.time.LocalDateTime since);
}
