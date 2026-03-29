package com.service.backend.fundraising.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateFundStatusRequest {

    @NotBlank
    @Size(min = 2, max = 255)
    @Schema(example = "ACTIVE")
    private String name;
}

