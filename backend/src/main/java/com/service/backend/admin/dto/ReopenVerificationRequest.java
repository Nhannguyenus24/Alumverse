package com.service.backend.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ReopenVerificationRequest {
    @NotBlank
    @Size(max = 255)

    private String requestType;

    @Size(max = 255)


    private String adminNote;
}
