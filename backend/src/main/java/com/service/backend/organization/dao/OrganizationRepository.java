package com.service.backend.organization.dao;

import com.service.backend.organization.dto.TrustedVerifierResponse;
import com.service.backend.shared.entity.Organization;
import org.jspecify.annotations.NonNull;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import java.util.Collection;
import com.service.backend.shared.dto.IdCountDTO;
import com.service.backend.shared.enums.Status;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface OrganizationRepository extends R2dbcRepository<Organization, Integer> {

    Mono<Organization> findBySlug(String slug);

    @NonNull
    Flux<Organization> findAll();

    @Query("SELECT u.id AS user_id, u.full_name, om.student_id as student_id, u.avatar_url, u.email, om.major, om.program " +
           "FROM users u " +
           "JOIN organization_members om ON u.id = om.user_id " +
           "WHERE om.organization_id = :organizationId " +
           "AND om.is_trusted_verifier = true " +
           "AND om.status = 'ACTIVE' " +
           "AND u.role <> 'ADMIN'")
    Flux<TrustedVerifierResponse> findTrustedVerifiersByOrganizationId(Integer organizationId);

    @Query("SELECT * FROM organizations WHERE :search IS NULL OR name ILIKE :search LIMIT :size OFFSET :offset")
    Flux<Organization> findAllWithFilters(@Param("search") String search, @Param("offset") int offset, @Param("size") int size);
    
    @Query("SELECT COUNT(*) FROM organizations WHERE :search IS NULL OR name ILIKE :search")
    Mono<Long> countWithFilters(@Param("search") String search);

    @Query("INSERT INTO organizations (name, slug, logo_url, status, features_config, programs, majors, contact_phone, contact_email, department_name) " +
           "VALUES (:name, :slug, :logoUrl, :status, " +
           "CAST(:featuresConfig AS json), CAST(:programs AS json), CAST(:majors AS json), :contactPhone, :contactEmail, :departmentName) " +
           "RETURNING *")
    Mono<Organization> insertOrganization(
            @Param("name") String name,
            @Param("slug") String slug,
            @Param("logoUrl") String logoUrl,
            @Param("status") Status status,
            @Param("featuresConfig") String featuresConfig,
            @Param("programs") String programs,
            @Param("majors") String majors,
            @Param("contactPhone") String contactPhone,
            @Param("contactEmail") String contactEmail,
            @Param("departmentName") String departmentName
    );

    @Modifying
    @Query("UPDATE organizations SET name = :name, slug = :slug, logo_url = :logoUrl, status = :status, " +
           "brand_config = CAST(:brandConfig AS json), features_config = CAST(:featuresConfig AS json), " +
           "programs = CAST(:programs AS json), majors = CAST(:majors AS json), " +
           "contact_phone = :contactPhone, contact_email = :contactEmail, department_name = :departmentName " +
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
            @Param("majors") String majors,
            @Param("contactPhone") String contactPhone,
            @Param("contactEmail") String contactEmail,
            @Param("departmentName") String departmentName
    );

    @Query("SELECT organization_id as id, COUNT(*) as count FROM organization_members " +
           "WHERE organization_id IN (:organizationIds) AND status = 'ACTIVE' " +
           "GROUP BY organization_id")
    Flux<IdCountDTO> countActiveMembersByOrganizations(@Param("organizationIds") Collection<Integer> organizationIds);
}
