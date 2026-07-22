package com.service.backend.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChangeMyPasswordRequest {

    @NotBlank(message = "Old password is required")
    @Size(max = 255)

    private String oldPassword;

    @NotBlank(message = "New password is required")
    @Size(min = 8, max = 50, message = "Password must be between 8 and 50 characters")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,50}$",
             message = "Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character")
    @Size(max = 255)

    private String newPassword;
}
