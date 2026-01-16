package com.service.backend.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("forum_posts")
public class ForumPost {

    @Id
    private Long id;

    @Column("topic_id")
    private Long topicId;

    @Column("author_member_id")
    private Long authorMemberId;

    private String title;

    private String content;

    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;
}
