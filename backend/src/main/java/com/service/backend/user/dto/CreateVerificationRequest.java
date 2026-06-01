package com.service.backend.user.dto;

import com.service.backend.shared.enums.DocumentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateVerificationRequest {
    @NotBlank
    private String base64File;
    
    @NotBlank
    private String originalFileName;
    
    @NotNull
    private DocumentType documentType;
}
