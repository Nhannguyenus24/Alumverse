package com.service.backend.article.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.relational.core.mapping.Column;

import java.time.LocalDateTime;

/**
 * Class-based R2DBC projection for public news lists.
 *
 * R2DBC populates this projection with full content for at most one featured item and one page.
 * The service replaces that content with a bounded plain-text preview before responding. Detail
 * endpoints intentionally continue using {@link NewsResponse} with full content.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NewsListItemResponse {

    @Column("id")
    private Integer id;

    @Column("organization_id")
    private Integer organizationId;

    @Column("author_member_id")
    private Integer authorMemberId;

    @Column("title")
    private String title;

    @Column("slug")
    private String slug;

    @Column("content")
    private String content;

    @Column("thumbnail_url")
    private String thumbnailUrl;

    @Column("topic")
    private String topic;

    @Column("url")
    private String url;

    @Column("is_hidden")
    private Boolean isHidden;

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("updated_at")
    private LocalDateTime updatedAt;
}
