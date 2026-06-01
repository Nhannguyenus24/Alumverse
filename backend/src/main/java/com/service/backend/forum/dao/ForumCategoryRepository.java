package com.service.backend.forum.dao;

import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.service.backend.forum.entity.ForumCategory;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface ForumCategoryRepository extends R2dbcRepository<ForumCategory, Integer> {
    
    /**
     * Find all forum categories by organization id
     */
    Flux<ForumCategory> findByOrganizationId(Integer organizationId);

    /**
     * Find forum category by name and organization id
     */
    Mono<ForumCategory> findByNameAndOrganizationId(String name, Integer organizationId);

    /**
     * Count categories by organization id
     */
    Mono<Long> countByOrganizationId(Integer organizationId);

    /**
     * Find all categories ordered by name
     */
    Flux<ForumCategory> findAllByOrganizationIdOrderByNameAsc(Integer organizationId);
}
