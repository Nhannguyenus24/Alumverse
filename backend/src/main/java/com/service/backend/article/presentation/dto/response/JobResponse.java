package com.service.backend.article.presentation.dto.response;

import com.service.backend.article.domain.entity.Job;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobResponse {

    private Integer id;
    private Integer organizationId;
    private Integer posterMemberId;
    private Boolean isReferral;
    private String type;
    private String title;
    private String companyName;
    private String location;
    private String salaryRange;
    private String description;
    private String howToApply;
    private LocalDate deadline;
    private Boolean isActive;
    private LocalDateTime createdAt;

    public static JobResponse from(Job job) {
        return JobResponse.builder()
                .id(job.getId())
                .organizationId(job.getOrganizationId())
                .posterMemberId(job.getPosterMemberId())
                .isReferral(job.getIsReferral())
                .type(job.getType())
                .title(job.getTitle())
                .companyName(job.getCompanyName())
                .location(job.getLocation())
                .salaryRange(job.getSalaryRange())
                .description(job.getDescription())
                .howToApply(job.getHowToApply())
                .deadline(job.getDeadline())
                .isActive(job.getIsActive())
                .createdAt(job.getCreatedAt())
                .build();
    }
}
