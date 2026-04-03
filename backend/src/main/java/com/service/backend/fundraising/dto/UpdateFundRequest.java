package com.service.backend.fundraising.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateFundRequest {

    @Size(max = 255)
    @Schema(example = "Quỹ học bổng sinh viên 2026 (đã cập nhật)")
    private String name;

    @Schema(example = "Mô tả ngắn đã cập nhật")
    @JsonProperty("description_short")
    private String descriptionShort;

    @Schema(example = "Mô tả đầy đủ đã cập nhật")
    @JsonProperty("description_full")
    private String descriptionFull;

    @Size(max = 255)
    @Schema(example = "Nguyễn Văn B")
    private String managerName;

    @Size(max = 255)
    @Schema(example = "https://example.com/fund-logo-updated.png")
    private String logoUrl;

    @Min(1)
    @Schema(example = "2")
    private Integer organizationId;
}
