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
@Table("forum_categories")
public class ForumCategory {
    
    @Id
    private Integer id;
    
    @Column("organization_id")
    private Integer organizationId;
    
    @Column("name")
    private String name;
    
    @Column("description")
    private String description;
    
    @Column("created_at")
    private LocalDateTime createdAt;
    
    @Column("updated_at")
    private LocalDateTime updatedAt;
}
