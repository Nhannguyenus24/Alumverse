package com.service.backend.organization.dao;

import com.service.backend.shared.entity.OrganizationSiteSettings;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface OrganizationSiteSettingsRepository extends R2dbcRepository<OrganizationSiteSettings, Integer> {

    @Modifying
    @Query("""
            INSERT INTO organization_site_settings (
                organization_id, contact_office, contact_address, contact_email,
                contact_phone, contact_admissions_phone, social_links, updated_at
            )
            VALUES (
                :organizationId, :contactOffice, :contactAddress, :contactEmail,
                :contactPhone, :contactAdmissionsPhone, CAST(:socialLinks AS json), CURRENT_TIMESTAMP
            )
            ON CONFLICT (organization_id) DO UPDATE SET
                contact_office = EXCLUDED.contact_office,
                contact_address = EXCLUDED.contact_address,
                contact_email = EXCLUDED.contact_email,
                contact_phone = EXCLUDED.contact_phone,
                contact_admissions_phone = EXCLUDED.contact_admissions_phone,
                social_links = EXCLUDED.social_links,
                updated_at = CURRENT_TIMESTAMP
            """)
    Mono<Integer> upsert(
            @Param("organizationId") Integer organizationId,
            @Param("contactOffice") String contactOffice,
            @Param("contactAddress") String contactAddress,
            @Param("contactEmail") String contactEmail,
            @Param("contactPhone") String contactPhone,
            @Param("contactAdmissionsPhone") String contactAdmissionsPhone,
            @Param("socialLinks") String socialLinks);
}
