package com.service.backend.user.dto;

import com.service.backend.shared.enums.DocumentType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class CreateVerificationRequest {
    @NotNull
    @Min(1)
    private Integer organizationId;

    private String base64File;

    private String originalFileName;

    private DocumentType documentType;

    @Valid
    private List<VerificationFileRequest> files;

    @Data
    public static class VerificationFileRequest {
        @NotBlank
        private String base64File;

        @NotBlank
        private String originalFileName;

        @NotNull
        private DocumentType documentType;
    }
}
