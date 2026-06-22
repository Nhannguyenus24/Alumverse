package com.service.backend.admin.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ReviewEducationChangeRequestDTO {

    @NotBlank
    private String decision; // APPROVED | REJECTED

    private String adminNote;
}
