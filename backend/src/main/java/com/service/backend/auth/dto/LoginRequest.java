
package com.service.backend.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import jakarta.validation.constraints.NotBlank;
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
    private Integer organizationId;

    @NotBlank(message = "Email is required")
    @Schema(example = "student01@hcmus.edu.vn")
    private String email;
    
    @NotBlank(message = "Password is required")
    @Schema(example = "Student@2024")
    private String password;

    @Schema(example = "true")
    private boolean rememberMe;

    // reCAPTCHA token, verified in RecaptchaService on the web /login route.
    // The mobile client uses /auth/mobile/login, which skips verification, so
    // this field is unused there.
    private String recaptchaToken;
}
