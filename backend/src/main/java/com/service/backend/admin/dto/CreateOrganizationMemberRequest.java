package com.service.backend.admin.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateOrganizationMemberRequest {
    
    @NotNull(message = "Organization ID is required")
    private Integer organizationId;
    
    private Integer userId;

    private String email;

    private String studentId;

    private String fullName;

    private String role;

    private String avatarUrl;

    private String password;

    private List<Integer> graduatedYear;

    private List<String> graduationStatus;

    private List<String> startedYear;

    private List<String> faculty;

    private List<String> program;

    private List<String> major;

    private List<String> department;
    
    @Builder.Default
    @Min(value = 0, message = "Verification level must be at least 0")
    private Integer verificationLevel = 0;

    @Builder.Default
    private Boolean isTrustedVerifier = false;

    @Builder.Default
    private String status = "ACTIVE";
}
