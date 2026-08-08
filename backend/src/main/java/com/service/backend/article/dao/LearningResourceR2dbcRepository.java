package com.service.backend.article.dao;

import com.service.backend.shared.entity.LearningResource;
import com.service.backend.shared.enums.Status;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface LearningResourceR2dbcRepository extends R2dbcRepository<LearningResource, Integer> {

    String PUBLIC_FILTER = """
            organization_id = :organizationId
              AND status = 'APPROVED'
              AND (:keyword = ''
                   OR POSITION(LOWER(:keyword) IN LOWER(COALESCE(title, ''))) > 0
                   OR POSITION(LOWER(:keyword) IN LOWER(COALESCE(description, ''))) > 0)
              AND (:topicsCsv = '' OR CASE UPPER(COALESCE(type, ''))
                    WHEN 'COURSE' THEN 'online_course'
                    WHEN 'EBOOK' THEN 'online_course'
                    WHEN 'VIDEO' THEN 'online_course'
                    WHEN 'OTHER' THEN 'achievement_scholarship'
                    WHEN 'MASTERS' THEN 'masters_doctorate'
                    WHEN 'DOCTORATE' THEN 'masters_doctorate'
                    ELSE LOWER(REPLACE(type, '-', '_'))
                  END = ANY(STRING_TO_ARRAY(:topicsCsv, ',')))
              AND (:fromDate = '' OR CAST(COALESCE(updated_at, created_at) AS date) >= CAST(NULLIF(:fromDate, '') AS date))
              AND (:toDate = '' OR CAST(COALESCE(updated_at, created_at) AS date) <= CAST(NULLIF(:toDate, '') AS date))
            """;

    String PUBLIC_ORDER = """
            ORDER BY
              CASE WHEN :direction = 'oldest' THEN COALESCE(updated_at, created_at) END ASC,
              CASE WHEN :direction = 'newest' THEN COALESCE(updated_at, created_at) END DESC,
              CASE WHEN :direction = 'oldest' THEN id END ASC,
              CASE WHEN :direction = 'newest' THEN id END DESC
            """;

    @Query("SELECT * FROM learning_resources WHERE " + PUBLIC_FILTER + PUBLIC_ORDER + " LIMIT 1")
    Mono<LearningResource> findPublicFeatured(Integer organizationId, String keyword, String topicsCsv,
                                               String fromDate, String toDate, String direction);

    @Query("SELECT * FROM learning_resources WHERE " + PUBLIC_FILTER
            + " AND (:featuredId IS NULL OR id <> :featuredId) " + PUBLIC_ORDER
            + " LIMIT :limit OFFSET :offset")
    Flux<LearningResource> findPublicPage(Integer organizationId, Integer featuredId, String keyword,
                                          String topicsCsv, String fromDate, String toDate,
                                          String direction, int limit, int offset);

    @Query("SELECT COUNT(*) FROM learning_resources WHERE " + PUBLIC_FILTER
            + " AND (:featuredId IS NULL OR id <> :featuredId)")
    Mono<Long> countPublicPage(Integer organizationId, Integer featuredId, String keyword,
                               String topicsCsv, String fromDate, String toDate);

    @Query("SELECT * FROM learning_resources WHERE organization_id = :organizationId ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<LearningResource> findByOrganizationIdWithPagination(Integer organizationId, int limit, int offset);

    @Query("SELECT COUNT(*) FROM learning_resources WHERE organization_id = :organizationId")
    Mono<Long> countByOrganizationId(Integer organizationId);

    @Query("SELECT * FROM learning_resources ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<LearningResource> findAllWithPagination(int limit, int offset);

    @Query("SELECT * FROM learning_resources WHERE LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%')) ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<LearningResource> searchAllByTitleWithPagination(String keyword, int limit, int offset);

    @Query("SELECT COUNT(*) FROM learning_resources WHERE LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Mono<Long> countAllSearchByTitle(String keyword);

    @Query("SELECT * FROM learning_resources WHERE organization_id = :organizationId AND type = :type AND status = 'APPROVED' ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<LearningResource> findByType(Integer organizationId, String type, int limit, int offset);

    @Query("SELECT COUNT(*) FROM learning_resources WHERE organization_id = :organizationId AND type = :type AND status = 'APPROVED'")
    Mono<Long> countByType(Integer organizationId, String type);

    @Query("SELECT * FROM learning_resources WHERE organization_id = :organizationId AND status = 'APPROVED' AND (LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(description) LIKE LOWER(CONCAT('%', :keyword, '%'))) ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<LearningResource> searchResources(Integer organizationId, String keyword, int limit, int offset);

    @Query("SELECT COUNT(*) FROM learning_resources WHERE organization_id = :organizationId AND status = 'APPROVED' AND (LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Mono<Long> countSearchResources(Integer organizationId, String keyword);

    @Query("SELECT * FROM learning_resources WHERE organization_id = :organizationId AND status = 'APPROVED' ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<LearningResource> findApprovedByOrganizationId(Integer organizationId, int limit, int offset);

    @Query("SELECT COUNT(*) FROM learning_resources WHERE organization_id = :organizationId AND status = 'APPROVED'")
    Mono<Long> countApprovedByOrganizationId(Integer organizationId);

    @Query("SELECT COUNT(*) FROM learning_resources WHERE status = 'APPROVED'")
    Mono<Long> countAllApproved();

    @Query("SELECT COUNT(*) FROM learning_resources WHERE type = :type AND status = 'APPROVED'")
    Mono<Long> countAllApprovedByType(String type);

    @Query("SELECT * FROM learning_resources WHERE type = :type AND status = 'APPROVED' ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<LearningResource> findAllApprovedByType(String type, int limit, int offset);

    @Modifying
    @Query("UPDATE learning_resources SET status = :status, updated_at = CURRENT_TIMESTAMP WHERE id = :id")
    Mono<Integer> updateStatus(Integer id, Status status);

    @Query("SELECT COUNT(*) FROM learning_resources WHERE created_at >= :since")
    Mono<Long> countSince(java.time.LocalDateTime since);
}
