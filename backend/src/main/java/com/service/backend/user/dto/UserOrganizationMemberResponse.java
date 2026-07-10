package com.service.backend.user.dto;

import java.time.LocalDateTime;
import java.util.List;

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
    private String organizationName;
    private Integer userId;
    private List<String> startedYear;
    private List<Integer> graduatedYear;
    private List<String> graduationStatus;
    private List<String> program;
    private List<String> major;
    private List<String> faculty;
    private List<String> department;
    private Integer verificationLevel;
    private Boolean isTrustedVerifier;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
