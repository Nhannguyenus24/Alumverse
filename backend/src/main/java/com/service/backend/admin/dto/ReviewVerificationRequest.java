package com.service.backend.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReviewVerificationRequest {
    @NotBlank(message = "Status is required")
    @Pattern(regexp = "APPROVED|REJECTED", message = "Status must be 'APPROVED' or 'REJECTED'")
    private String status;

    private String adminNote;
}
