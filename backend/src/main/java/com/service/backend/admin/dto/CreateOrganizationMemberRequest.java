package com.service.backend.admin.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
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
    
    @NotNull(message = "User ID is required")
    private Integer userId;

    private Integer graduatedYear;

    private String graduationStatus;

    private String program;

    private String major;
    
    @Builder.Default
    @Min(value = 0, message = "Verification level must be at least 0")
    private Integer verificationLevel = 0;
    
    @Builder.Default
    private String status = "active";
}
