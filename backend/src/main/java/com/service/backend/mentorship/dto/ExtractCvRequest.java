package com.service.backend.mentorship.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ExtractCvRequest {
    @NotBlank
    private String base64File;

    @NotBlank
    private String originalFileName;
}
