package com.service.backend.article.dto;

import com.service.backend.shared.entity.Job;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.service.backend.shared.enums.JobType;
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
    private JobType type;
    private String title;
    private String companyName;
    private String location;
    private String salaryRange;
    private String description;
    private String howToApply;
    private String url;
    private String thumbnailUrl;
    private LocalDate deadline;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String submitterName;
    private String submitterRole;
    private Boolean userSubmitted;

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
                .url(job.getUrl())
                .thumbnailUrl(job.getThumbnailUrl())
                .deadline(job.getDeadline())
                .isActive(job.getIsActive())
                .createdAt(job.getCreatedAt())
                .updatedAt(job.getUpdatedAt())
                .build();
    }
}
