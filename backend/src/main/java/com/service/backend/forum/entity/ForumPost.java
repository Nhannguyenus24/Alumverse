package com.service.backend.forum.entity;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
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
@Table("forum_posts")
public class ForumPost {
    
    @Id
    private Integer id;
    
    @Column("topic_id")
    private Integer topicId;
    
    @Column("author_member_id")
    private Integer authorMemberId;
    
    @Column("content")
    private String content;
    
    @Column("answer_to_post_id")
    private Integer answerToPostId;
    
    @Column("is_banned")
    private Boolean isBanned;

    @Column("is_hidden")
    private Boolean isHidden;
    
    @Column("created_at")
    private LocalDateTime createdAt;
    
    @Column("updated_at")
    private LocalDateTime updatedAt;
}
