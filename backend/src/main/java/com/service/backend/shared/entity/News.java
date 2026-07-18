package com.service.backend.shared.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("news")
public class News {

    @Id
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
    @Builder.Default
    private Boolean isHidden = false;

    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column("updated_at")
    private LocalDateTime updatedAt;
}
