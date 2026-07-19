package com.service.backend.shared.entity;

import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table("news_comments")
public class NewsComment {

    @Id
    private Integer id;

    @Column("news_id")
    private Integer newsId;

    @Column("author_member_id")
    private Integer authorMemberId;

    @Column("content")
    private String content;

    @Column("parent_comment_id")
    private Integer parentCommentId;

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
