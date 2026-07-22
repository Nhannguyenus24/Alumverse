package com.service.backend.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateOrganizationOptionRequest {

    @NotBlank(message = "Old value is required")
    @Size(max = 255)

    private String oldValue;

    @NotBlank(message = "New value is required")
    @Size(max = 255)

    private String newValue;
}
