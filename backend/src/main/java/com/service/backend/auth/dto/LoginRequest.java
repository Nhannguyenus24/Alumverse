
package com.service.backend.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginRequest {

    @Schema(example = "1")
    @NotNull

    @Min(value = 1)

    private Integer organizationId;

    @NotBlank(message = "Email is required")
    @Schema(example = "student01@hcmus.edu.vn")
    @Size(max = 255)

    private String email;
    
    @NotBlank(message = "Password is required")
    @Schema(example = "Student@2024")
    @Size(max = 255)

    private String password;

    @Schema(example = "true")
    private boolean rememberMe;

    // Optional: the web client sends a token (verified in RecaptchaService);
    // the mobile client has no reCAPTCHA widget and omits it (verification is
    // skipped when blank).
    @Size(max = 255)

    private String recaptchaToken;
}
