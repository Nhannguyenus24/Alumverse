package com.service.backend.article.dto;

import com.service.backend.shared.entity.News;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NewsResponse {

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
    private LocalDateTime publishedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String submitterName;
    private String submitterRole;
    private Boolean userSubmitted;

    public static NewsResponse from(News news) {
        return NewsResponse.builder()
                .id(news.getId())
                .organizationId(news.getOrganizationId())
                .authorMemberId(news.getAuthorMemberId())
                .title(news.getTitle())
                .slug(news.getSlug())
                .content(news.getContent())
                .thumbnailUrl(news.getThumbnailUrl())
                .topic(news.getTopic())
                .url(news.getUrl())
                .isHidden(news.getIsHidden())
                .publishedAt(news.getPublishedAt())
                .createdAt(news.getCreatedAt())
                .updatedAt(news.getUpdatedAt())
                .build();
    }
}
