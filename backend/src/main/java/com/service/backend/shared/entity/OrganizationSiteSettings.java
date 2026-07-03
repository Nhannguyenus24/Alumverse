package com.service.backend.shared.entity;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("organization_site_settings")
public class OrganizationSiteSettings {

    @Id
    @Column("organization_id")
    private Integer organizationId;

    @Column("contact_office")
    private String contactOffice;

    @Column("contact_address")
    private String contactAddress;

    @Column("contact_email")
    private String contactEmail;

    @Column("contact_phone")
    private String contactPhone;

    @Column("contact_admissions_phone")
    private String contactAdmissionsPhone;

    @Column("social_links")
    private String socialLinks;

    @LastModifiedDate
    @Column("updated_at")
    private LocalDateTime updatedAt;
}
