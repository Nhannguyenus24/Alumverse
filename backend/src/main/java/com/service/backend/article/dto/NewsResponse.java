package com.service.backend.article.dto;

import com.service.backend.article.entity.News;
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
    private Boolean isHidden;
    private LocalDateTime publishedAt;

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
                .isHidden(news.getIsHidden())
                .publishedAt(news.getPublishedAt())
                .build();
    }
}
