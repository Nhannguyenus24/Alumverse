package com.service.backend.admin.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ReopenVerificationRequest {
    @NotBlank
    private String requestType;

    private String adminNote;
}
