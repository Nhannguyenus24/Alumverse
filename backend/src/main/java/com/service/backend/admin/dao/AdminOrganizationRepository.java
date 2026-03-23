package com.service.backend.admin.dao;

import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;

import com.service.backend.admin.entity.Organization;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface AdminOrganizationRepository extends R2dbcRepository<Organization, Integer> {
    
    /**
     * Find organization by slug
     */
    Mono<Organization> findBySlug(String slug);
    
    /**
     * Find organizations with pagination
     */
    @Query("SELECT * FROM organizations LIMIT :size OFFSET :offset")
    Flux<Organization> findAllWithPagination(int offset, int size);
    
    /**
     * Count total organizations
     */
    Mono<Long> count();
}
