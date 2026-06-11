package com.service.backend.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoogleLoginRequest {

    @NotBlank(message = "Google ID token is required")
    @Schema(example = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjEifQ...")
    private String idToken;

    @NotNull(message = "Organization ID is required")
    @Min(value = 1, message = "Organization ID must be greater than 0")
    @Schema(example = "1")
    private Integer organizationId;

    @Schema(example = "true")
    private boolean rememberMe;
}
