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
public class ForumTopicDTO {
    private Integer id;
    private Integer organizationId;
    private String title;
    private Integer createdByMemberId;
    private Integer categoryId;
    private Integer viewCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
