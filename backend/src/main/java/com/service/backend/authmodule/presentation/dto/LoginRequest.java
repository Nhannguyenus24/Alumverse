package com.service.backend.authmodule.presentation.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class LoginRequest {
//    @NotBlank(message = "reCAPTCHA token is required")
//    private String recaptchaToken;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters long")
    private String password;
}
