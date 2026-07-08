package com.service.backend.admin.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.service.backend.shared.enums.Status;
import com.service.backend.shared.enums.UserRole;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class UserResponse {
    private Integer id;
    private String email;
    private String studentId;
    private Status status;
    private UserRole role;
    private String avatarUrl;
    private String coverUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    /** From users.full_name (admin list/detail enrichment). */
    private String fullName;
    /** Primary organization_members row (lowest id) for this user, if any. */
    private Integer organizationId;
    private String organizationName;
    private Integer verificationLevel;
    private Boolean isTrustedVerifier;
    private String membershipStatus;
    private List<String> startedYear;
    private List<Integer> graduatedYear;
    private List<String> graduationStatus;
    private List<String> program;
    private List<String> major;
}
