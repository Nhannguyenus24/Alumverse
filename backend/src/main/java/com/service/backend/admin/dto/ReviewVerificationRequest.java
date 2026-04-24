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
    @Pattern(regexp = "approved|rejected", message = "Status must be 'approved' or 'rejected'")
    private String status;

    private String adminNote;
}
