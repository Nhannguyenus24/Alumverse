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
    private String authorName;
    private String authorAvatarUrl;
    private Integer categoryId;
    private Integer viewCount;
    private String status;
    private Long postCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
