package com.service.common.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
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
    private Long id;

    @Column("organization_id")
    private Long organizationId;

    @Column("author_member_id")
    private Long authorMemberId;

    private String title;

    private String slug;

    private String content;

    @Column("thumbnail_url")
    private String thumbnailUrl;

    @Column("is_hidden")
    private Boolean isHidden;

    @Column("published_at")
    private LocalDateTime publishedAt;
}
