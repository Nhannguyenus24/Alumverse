package com.service.backend.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {
    
    @Schema(description = "Access token for authenticated requests")
    private String accessToken;

    @Schema(description = "Whether user needs to complete organization membership setup", example = "false")
    private Boolean needsOrganizationSetup;
}
