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
public class ForumPostDTO {
    private Integer id;
    private Integer topicId;
    private Integer authorMemberId;
    private String content;
    private Integer answerToPostId;
    private Boolean isBanned;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
