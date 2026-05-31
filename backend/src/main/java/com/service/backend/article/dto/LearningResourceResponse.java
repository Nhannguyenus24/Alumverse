package com.service.backend.article.dto;

import com.service.backend.shared.entity.LearningResource;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    private LocalDateTime createdAt;

    public static LearningResourceResponse from(LearningResource resource) {
        return LearningResourceResponse.builder()
                .id(resource.getId())
                .organizationId(resource.getOrganizationId())
                .uploaderMemberId(resource.getUploaderMemberId())
                .title(resource.getTitle())
                .type(resource.getType())
                .linkUrl(resource.getLinkUrl())
                .description(resource.getDescription())
                .createdAt(resource.getCreatedAt())
                .build();
    }
}
