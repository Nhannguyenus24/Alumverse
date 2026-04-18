
package com.service.backend.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginRequest {

    @NotNull(message = "Organization ID is required")
    @Min(value = 1, message = "Organization ID must be greater than 0")
    @Schema(example = "1")
    private Integer organizationId;

    @NotBlank(message = "Email or username is required")
    @Schema(example = "student01@hcmus.edu.vn")
    private String email;
    
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
             message = "Password invalid")
    @NotBlank(message = "Password is required")
    @Schema(example = "Student@2024")
    private String password;
}
