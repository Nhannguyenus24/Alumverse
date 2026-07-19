package com.service.backend.article.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NewsCommentDTO {
    private Integer id;
    private Integer newsId;
    private Integer authorMemberId;
    private String authorName;
    private String authorAvatarUrl;
    private String content;
    private Integer parentCommentId;
    private Boolean isHidden;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
