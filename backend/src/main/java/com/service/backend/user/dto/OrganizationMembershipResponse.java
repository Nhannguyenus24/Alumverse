package com.service.backend.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for organization membership response
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrganizationMembershipResponse {
    
    private Integer id;
    
    private Integer organizationId;
    
    private String organizationName;
    
    private String organizationSlug;
    
    private String organizationLogoUrl;
    
    private Integer verificationLevel;
    
    private Boolean isTrustedVerifier;
    
    private String status;
}
