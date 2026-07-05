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

    @Schema(description = "Verification level of the user in the organization", example = "0")
    private Integer verificationLevel;

    @Schema(description = "Whether the user must change their password before continuing", example = "false")
    private boolean mustChangePassword;
}
