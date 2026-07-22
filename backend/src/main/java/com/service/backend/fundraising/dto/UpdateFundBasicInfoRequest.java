package com.service.backend.fundraising.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
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
public class UpdateFundBasicInfoRequest {

    @NotBlank
    @Size(max = 255)
    @Schema(example = "Nguyễn Văn B")
    private String managerName;

    @NotBlank
    @Email
    @Schema(example = "manager@hcmus.edu.vn")
    private String managerEmail;

    @NotBlank
    @Schema(example = "Mô tả đầy đủ đã cập nhật")
    @JsonProperty("description_full")
    private String descriptionFull;
}
