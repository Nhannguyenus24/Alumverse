package com.service.backend.user.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserOrganizationMemberResponse {
    private Integer id;
    private Integer organizationId;
    private Integer userId;
    private Integer graduatedYear;
    private String graduationStatus;
    private String program;
    private String major;
    private Integer verificationLevel;
    private Boolean isTrustedVerifier;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
