package com.service.backend.forum.entities;

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
@Table("forum_post_reactions")
public class ForumPostReaction {
    
    @Id
    private Integer id;
    
    @Column("post_id")
    private Integer postId;
    
    @Column("member_id")
    private Integer memberId;
    
    @Column("created_at")
    private LocalDateTime createdAt;
}
