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
public class ForumPostReportDTO {
    private Long id;
    private Integer postId;
    private Integer reporterMemberId;
    private String reason;
    private String description;
    private String status;
    private Integer reviewedByUserId;
    private String reviewNote;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
