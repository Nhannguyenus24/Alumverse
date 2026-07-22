package com.service.backend.mentorship.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ExtractCvRequest {
    @NotBlank
    @Size(max = 255)

    private String base64File;

    @NotBlank
    @Size(max = 255)

    private String originalFileName;
}
