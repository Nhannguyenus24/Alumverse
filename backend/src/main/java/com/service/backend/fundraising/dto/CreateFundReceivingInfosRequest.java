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
public class CreateFundReceivingInfosRequest {

    @NotBlank
    @Size(min = 3, max = 255)
    @Schema(example = "1234567890")
    private String accountNumber;

    @NotBlank
    @Size(min = 3, max = 255)
    @Schema(example = "HCMUS Student Scholarship Fund")
    private String accountName;

    @NotBlank
    @Size(min = 3, max = 255)
    @Schema(example = "VietcomBank")
    private String bankName;
}

