
package com.service.backend.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class SendOtpRequest {
    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    @Schema(example = "student01@hcmus.edu.vn")
    private String email;
}
