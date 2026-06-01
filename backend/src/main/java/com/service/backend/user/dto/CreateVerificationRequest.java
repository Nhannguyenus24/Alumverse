package com.service.backend.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateVerificationRequest {
    @NotBlank
    private String base64File;
    
    @NotBlank
    private String originalFileName;
    
    @NotBlank
    private String documentType;
}
