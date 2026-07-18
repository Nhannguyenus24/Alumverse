package com.service.backend.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminMentorshipReportDTO {

    private Integer id;
    private Integer sessionId;

    private Integer reporterMemberId;
    private String reporterName;
    private String reporterEmail;

    private Integer reportedMemberId;
    private String reportedName;
    private String reportedEmail;
    private String reportedUserStatus;

    private String reasonCategory;
    private String description;

    private String status;
    private String actionTaken;
    private String resolutionNote;
    private Integer resolvedBy;
    private LocalDateTime resolvedAt;

    private LocalDateTime createdAt;
}
