package com.service.backend.forum.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.service.backend.shared.enums.Status;

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
    private Status status;
    private Integer reviewedByUserId;
    private String reviewNote;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
