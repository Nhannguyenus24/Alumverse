package com.service.backend.admin.dao;

import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.service.backend.organization.entity.Organization;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface AdminOrganizationRepository extends R2dbcRepository<Organization, Integer> {
    
    /**
     * Find organization by slug
     */
    Mono<Organization> findBySlug(String slug);
    
    /**
     * Find organizations with search and pagination
     */
    @Query("SELECT * FROM organizations WHERE :search IS NULL OR name ILIKE :search LIMIT :size OFFSET :offset")
    Flux<Organization> findAllWithFilters(@Param("search") String search, @Param("offset") int offset, @Param("size") int size);
    
    /**
     * Count total organizations with search
     */
    @Query("SELECT COUNT(*) FROM organizations WHERE :search IS NULL OR name ILIKE :search")
    Mono<Long> countWithFilters(@Param("search") String search);

    /**
     * Count active members in a specific organization
     */
    @Query("SELECT COUNT(*) FROM organization_members WHERE organization_id = :organizationId AND status = 'active'")
    Mono<Long> countActiveMembersByOrganization(@Param("organizationId") Integer organizationId);
}

