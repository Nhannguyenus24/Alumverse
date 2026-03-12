package com.service.backend.article.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("jobs")
public class Job {

    @Id
    private Integer id;

    @Column("organization_id")
    private Integer organizationId;

    @Column("poster_member_id")
    private Integer posterMemberId;

    @Column("is_referral")
    @Builder.Default
    private Boolean isReferral = false;

    private String type;

    private String title;

    @Column("company_name")
    private String companyName;

    private String location;

    @Column("salary_range")
    private String salaryRange;

    private String description;

    @Column("how_to_apply")
    private String howToApply;

    private LocalDate deadline;

    @Column("is_active")
    @Builder.Default
    private Boolean isActive = true;

    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;
}
