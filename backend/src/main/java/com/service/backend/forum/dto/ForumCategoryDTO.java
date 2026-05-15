package com.service.backend.forum.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ForumCategoryDTO {
    private Integer id;
    private Integer parentId;
    private Integer organizationId;
    private String name;
    private String description;
    private Long topicCount;
    private Long participantCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
