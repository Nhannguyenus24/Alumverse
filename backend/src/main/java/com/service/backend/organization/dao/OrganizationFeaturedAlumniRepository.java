package com.service.backend.organization.dao;

import com.service.backend.organization.dto.FeaturedAlumniResponse;
import com.service.backend.shared.entity.OrganizationFeaturedAlumni;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface OrganizationFeaturedAlumniRepository extends R2dbcRepository<OrganizationFeaturedAlumni, Integer> {

    @Query("""
            SELECT ofa.id,
                   ofa.organization_id,
                   ofa.user_id,
                   ofa.display_order,
                   ofa.note,
                   u.full_name,
                   u.avatar_url,
                   u.cover_url,
                   u.bio,
                   u.current_job_title,
                   u.current_company
            FROM organization_featured_alumni ofa
            JOIN users u ON u.id = ofa.user_id
            WHERE ofa.organization_id = :organizationId
            ORDER BY ofa.display_order ASC, ofa.id ASC
            """)
    Flux<FeaturedAlumniResponse> findFeaturedByOrganizationId(@Param("organizationId") Integer organizationId);

    @Modifying
    @Query("DELETE FROM organization_featured_alumni WHERE organization_id = :organizationId")
    Mono<Integer> deleteByOrganizationId(@Param("organizationId") Integer organizationId);

    @Modifying
    @Query("""
            INSERT INTO organization_featured_alumni (organization_id, user_id, display_order, note, created_at, updated_at)
            VALUES (:organizationId, :userId, :displayOrder, :note, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (organization_id, user_id) DO UPDATE SET
                display_order = EXCLUDED.display_order,
                note = EXCLUDED.note,
                updated_at = CURRENT_TIMESTAMP
            """)
    Mono<Integer> upsert(
            @Param("organizationId") Integer organizationId,
            @Param("userId") Integer userId,
            @Param("displayOrder") Integer displayOrder,
            @Param("note") String note);
}
