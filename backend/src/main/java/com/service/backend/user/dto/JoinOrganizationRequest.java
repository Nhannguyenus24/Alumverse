package com.service.backend.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * DTO for joining/registering to an organization
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JoinOrganizationRequest {
    
    @NotNull(message = "Organization ID is required")
    private Integer organizationId;
    
    // Optional academic information
    private String studentCode;
    
    private String className;
    
    private Integer startYear;
    
    private Integer graduatedYear;
    
    private String degreeType;
}
