package com.service.backend.admin.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
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
    @NotNull

    @Min(value = 1)

    private Integer organizationId;
    
    @NotNull

    
    @Min(value = 1)

    
    private Integer userId;

    @Size(max = 255)


    private String email;

    @Size(max = 255)


    private String studentId;

    @Size(max = 255)


    private String fullName;

    @Size(max = 255)


    private String role;

    @Size(max = 255)


    private String avatarUrl;

    @Size(max = 255)


    private String password;

    @Size(max = 100)


    private List<Integer> graduatedYear;

    @Size(max = 100)


    private List<String> graduationStatus;

    @Size(max = 100)


    private List<String> startedYear;

    @Size(max = 100)


    private List<String> faculty;

    @Size(max = 100)


    private List<String> program;

    @Size(max = 100)


    private List<String> major;

    @Size(max = 100)


    private List<String> department;
    
    @Builder.Default
    @Min(value = 0, message = "Verification level must be at least 0")
    private Integer verificationLevel = 0;

    @Builder.Default
    private Boolean isTrustedVerifier = false;

    @Builder.Default
    private String status = "ACTIVE";
}
