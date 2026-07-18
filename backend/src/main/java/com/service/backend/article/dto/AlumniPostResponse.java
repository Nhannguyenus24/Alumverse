package com.service.backend.article.dto;

import com.service.backend.shared.entity.AlumniPost;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlumniPostResponse {

    private Integer id;
    private Integer organizationId;
    private Integer authorMemberId;
    private String title;
    private String slug;
    private String content;
    private String thumbnailUrl;
    private String topic;
    private String url;
    private Boolean isHidden;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String submitterName;
    private String submitterRole;
    private Boolean userSubmitted;

    public static AlumniPostResponse from(AlumniPost post) {
        return AlumniPostResponse.builder()
                .id(post.getId())
                .organizationId(post.getOrganizationId())
                .authorMemberId(post.getAuthorMemberId())
                .title(post.getTitle())
                .slug(post.getSlug())
                .content(post.getContent())
                .thumbnailUrl(post.getThumbnailUrl())
                .topic(post.getTopic())
                .url(post.getUrl())
                .isHidden(post.getIsHidden())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }
}
