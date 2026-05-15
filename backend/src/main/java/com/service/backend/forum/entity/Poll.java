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
@Table("forum_polls")
public class Poll {
    
    @Id
    private Integer id;
    
    @Column("topic_id")
    private Integer topicId;
    
    @Column("organization_id")
    private Integer organizationId;
    
    @Column("created_by_member_id")
    private Integer createdByMemberId;
    
    @Column("title")
    private String title;
    
    @Column("description")
    private String description;
    
    @Column("allow_multiple_votes")
    private Boolean allowMultipleVotes;
    
    @Column("is_active")
    private Boolean isActive;
    
    @Column("created_at")
    private LocalDateTime createdAt;
    
    @Column("updated_at")
    private LocalDateTime updatedAt;
}
