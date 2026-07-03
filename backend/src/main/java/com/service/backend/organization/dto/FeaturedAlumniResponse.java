package com.service.backend.organization.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.relational.core.mapping.Column;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeaturedAlumniResponse {
    private Integer id;
    @Column("organization_id")
    private Integer organizationId;
    @Column("user_id")
    private Integer userId;
    @Column("display_order")
    private Integer displayOrder;
    private String note;
    @Column("full_name")
    private String fullName;
    @Column("avatar_url")
    private String avatarUrl;
    @Column("cover_url")
    private String coverUrl;
    private String bio;
    @Column("current_job_title")
    private String currentJobTitle;
    @Column("current_company")
    private String currentCompany;
}
