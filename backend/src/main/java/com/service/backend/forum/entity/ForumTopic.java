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
@Table("forum_topics")
public class ForumTopic {
    
    @Id
    private Integer id;
    
    @Column("organization_id")
    private Integer organizationId;
    
    @Column("title")
    private String title;
    
    @Column("created_by_member_id")
    private Integer createdByMemberId;
    
    @Column("category_id")
    private Integer categoryId;
    
    @Column("view_count")
    private Integer viewCount;

    @Column("is_locked")
    private Boolean isLocked;
    
    @Column("created_at")
    private LocalDateTime createdAt;
    
    @Column("updated_at")
    private LocalDateTime updatedAt;
}
