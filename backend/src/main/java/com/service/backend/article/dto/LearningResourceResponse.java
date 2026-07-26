package com.service.backend.article.dto;

import com.service.backend.shared.entity.LearningResource;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.service.backend.shared.enums.Status;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LearningResourceResponse {

    private Integer id;
    private Integer organizationId;
    private Integer uploaderMemberId;
    private String title;
    private String type;
    private String linkUrl;
    private String description;
    private String thumbnailUrl;
    private Status status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String submitterName;
    private String submitterRole;
    private Boolean userSubmitted;

    public static LearningResourceResponse from(LearningResource resource) {
        return LearningResourceResponse.builder()
                .id(resource.getId())
                .organizationId(resource.getOrganizationId())
                .uploaderMemberId(resource.getUploaderMemberId())
                .title(resource.getTitle())
                .type(resource.getType())
                .linkUrl(resource.getLinkUrl())
                .description(resource.getDescription())
                .thumbnailUrl(resource.getThumbnailUrl())
                .status(resource.getStatus())
                .createdAt(resource.getCreatedAt())
                .updatedAt(resource.getUpdatedAt())
                .build();
    }
}
