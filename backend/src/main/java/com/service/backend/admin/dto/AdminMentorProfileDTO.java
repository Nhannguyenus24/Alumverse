package com.service.backend.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminMentorProfileDTO {

    private Integer memberId;
    private String mentorName;
    private String mentorEmail;
    private String currentJobTitle;
    private String currentCompany;
    private String bio;
    private BigDecimal ratingAvg;
    private Integer totalSessions;
    private String status;
    private String reviewNote;
    private LocalDateTime reviewedAt;
    private String coverUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
