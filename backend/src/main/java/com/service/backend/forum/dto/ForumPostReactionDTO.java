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
public class ForumPostReactionDTO {
    private Integer id;
    private Integer postId;
    private Integer memberId;
    private LocalDateTime createdAt;
}
