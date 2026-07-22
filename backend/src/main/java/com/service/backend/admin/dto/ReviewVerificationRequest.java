package com.service.backend.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.AssertTrue;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReviewVerificationRequest {
    @NotBlank(message = "Status is required")
    @Pattern(regexp = "APPROVED|REJECTED", message = "Status must be 'APPROVED' or 'REJECTED'")
    @Size(max = 255)

    private String status;

    @Size(max = 255)


    private String adminNote;

    @AssertTrue(message = "Admin note is required when rejecting a verification request")
    public boolean isRejectReasonProvided() {
        return !"REJECTED".equalsIgnoreCase(status) || (adminNote != null && !adminNote.trim().isEmpty());
    }
}
