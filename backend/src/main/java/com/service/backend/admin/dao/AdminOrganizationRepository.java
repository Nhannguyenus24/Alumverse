package com.service.backend.admin.dao;

import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.service.backend.shared.dto.IdCountDTO;
import com.service.backend.shared.entity.Organization;
import com.service.backend.shared.enums.Status;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collection;

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

    @Query("INSERT INTO organizations (name, slug, logo_url, status, features_config, programs, majors) " +
           "VALUES (:name, :slug, :logoUrl, :status, " +
           "CAST(:featuresConfig AS json), CAST(:programs AS json), CAST(:majors AS json)) " +
           "RETURNING *")
    Mono<Organization> insertOrganization(
            @Param("name") String name,
            @Param("slug") String slug,
            @Param("logoUrl") String logoUrl,
            @Param("status") Status status,
            @Param("featuresConfig") String featuresConfig,
            @Param("programs") String programs,
            @Param("majors") String majors
    );

    @Modifying
    @Query("UPDATE organizations SET name = :name, slug = :slug, logo_url = :logoUrl, status = :status, " +
           "brand_config = CAST(:brandConfig AS json), features_config = CAST(:featuresConfig AS json), " +
           "programs = CAST(:programs AS json), majors = CAST(:majors AS json) " +
           "WHERE id = :id")
    Mono<Integer> updateOrganizationFields(
            @Param("id") Integer id,
            @Param("name") String name,
            @Param("slug") String slug,
            @Param("logoUrl") String logoUrl,
            @Param("status") Status status,
            @Param("brandConfig") String brandConfig,
            @Param("featuresConfig") String featuresConfig,
            @Param("programs") String programs,
            @Param("majors") String majors
    );

    /**
     * Count active members in a specific organization
     */
    @Query("SELECT COUNT(*) FROM organization_members WHERE organization_id = :organizationId AND status = 'ACTIVE'")
    Mono<Long> countActiveMembersByOrganization(@Param("organizationId") Integer organizationId);

    /**
     * Batch variant of {@link #countActiveMembersByOrganization}: active member counts per
     * organization for a set of organizations in a single query.
     */
    @Query("SELECT organization_id as id, COUNT(*) as count FROM organization_members " +
           "WHERE organization_id IN (:organizationIds) AND status = 'ACTIVE' " +
           "GROUP BY organization_id")
    Flux<IdCountDTO> countActiveMembersByOrganizations(@Param("organizationIds") Collection<Integer> organizationIds);
}

