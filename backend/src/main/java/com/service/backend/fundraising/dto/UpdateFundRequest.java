package com.service.backend.fundraising.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.validator.constraints.URL;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateFundRequest {

    @NotBlank
    @Size(max = 255)
    @Schema(example = "Quỹ học bổng sinh viên 2026 (đã cập nhật)")
    private String name;

    @NotBlank
    @Size(max = 100)
    @Schema(example = "Mô tả ngắn đã cập nhật")
    @JsonProperty("description_short")
    private String descriptionShort;

    @NotBlank
    @Schema(example = "Mô tả đầy đủ đã cập nhật")
    @JsonProperty("description_full")
    private String descriptionFull;

    @NotBlank
    @Size(max = 255)
    @Schema(example = "Nguyễn Văn B")
    private String managerName;

    @URL
    @Size(max = 255)
    @Schema(example = "https://example.com/fund-logo-updated.png")
    private String logoUrl;

    @NotNull
    @Positive
    @Schema(example = "1000000000")
    private BigDecimal targetAmount;

    @NotNull
    @Min(1)
    @Schema(example = "2")
    private Integer fundReceivingInfoId;

    @NotNull
    @Schema(example = "2026-05-01T08:00:00")
    private LocalDateTime timeStarted;

    @NotNull
    @Schema(example = "2026-06-01T23:59:59")
    private LocalDateTime timeEnded;

    @Schema(example = "Học bổng sinh viên")
    private String topic;

    @NotBlank
    @Email
    @Schema(example = "manager@hcmus.edu.vn")
    private String managerEmail;
}
