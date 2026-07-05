package com.service.backend.forum.dao;

import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;

import com.service.backend.shared.entity.ForumCategory;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface ForumCategoryRepository extends R2dbcRepository<ForumCategory, Integer> {
    
    /**
     * Find all forum categories by organization id
     */
    Flux<ForumCategory> findByOrganizationId(Integer organizationId);

    /**
     * Find forum categories by organization id filtered by status (public listing uses ACTIVE).
     */
    Flux<ForumCategory> findByOrganizationIdAndStatus(Integer organizationId, String status);

    /**
     * Find direct child categories of a category. Used when cascade-deleting a category.
     */
    Flux<ForumCategory> findByParentId(Integer parentId);

    /**
     * Count categories by organization id
     */
    Mono<Long> countByOrganizationId(Integer organizationId);
}
