package com.service.backend.article.dao;

import com.service.backend.shared.entity.LearningResource;
import com.service.backend.shared.enums.LearningResourceType;
import com.service.backend.shared.enums.Status;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface LearningResourceR2dbcRepository extends R2dbcRepository<LearningResource, Integer> {

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

    @Query("SELECT * FROM learning_resources WHERE status = 'APPROVED' AND (LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(description) LIKE LOWER(CONCAT('%', :keyword, '%'))) ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<LearningResource> searchAllApprovedByTitleWithPagination(String keyword, int limit, int offset);

    @Query("SELECT COUNT(*) FROM learning_resources WHERE status = 'APPROVED' AND (LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Mono<Long> countAllApprovedSearchByTitle(String keyword);

    @Query("SELECT * FROM learning_resources WHERE organization_id = :organizationId AND type = :type AND status = 'APPROVED' ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<LearningResource> findByType(Integer organizationId, LearningResourceType type, int limit, int offset);

    @Query("SELECT COUNT(*) FROM learning_resources WHERE organization_id = :organizationId AND type = :type AND status = 'APPROVED'")
    Mono<Long> countByType(Integer organizationId, LearningResourceType type);

    @Query("SELECT * FROM learning_resources WHERE organization_id = :organizationId AND status = 'APPROVED' AND (LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(description) LIKE LOWER(CONCAT('%', :keyword, '%'))) ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<LearningResource> searchResources(Integer organizationId, String keyword, int limit, int offset);

    @Query("SELECT COUNT(*) FROM learning_resources WHERE organization_id = :organizationId AND status = 'APPROVED' AND (LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Mono<Long> countSearchResources(Integer organizationId, String keyword);

    @Query("SELECT * FROM learning_resources WHERE organization_id = :organizationId AND status = 'APPROVED' ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<LearningResource> findApprovedByOrganizationId(Integer organizationId, int limit, int offset);

    @Query("SELECT COUNT(*) FROM learning_resources WHERE organization_id = :organizationId AND status = 'APPROVED'")
    Mono<Long> countApprovedByOrganizationId(Integer organizationId);

    @Query("SELECT * FROM learning_resources WHERE status = 'APPROVED' ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<LearningResource> findAllApprovedWithPagination(int limit, int offset);

    @Query("SELECT COUNT(*) FROM learning_resources WHERE status = 'APPROVED'")
    Mono<Long> countAllApproved();

    @Modifying
    @Query("UPDATE learning_resources SET status = :status, updated_at = CURRENT_TIMESTAMP WHERE id = :id")
    Mono<Integer> updateStatus(Integer id, Status status);

    @Query("SELECT COUNT(*) FROM learning_resources WHERE created_at >= :since")
    Mono<Long> countSince(java.time.LocalDateTime since);
}
