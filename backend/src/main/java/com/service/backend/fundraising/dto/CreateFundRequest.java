package com.service.backend.fundraising.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateFundRequest {

    @NotBlank
    @Size(min = 3, max = 255)
    @Schema(example = "Quỹ học bổng sinh viên 2026")
    private String name;

    @NotBlank
    @Schema(example = "Hỗ trợ tài chính cho sinh viên có hoàn cảnh khó khăn (ngắn)")
    @JsonProperty("description_short")
    private String descriptionShort;

    @NotBlank
    @Schema(example = "Hỗ trợ tài chính cho sinh viên có hoàn cảnh khó khăn, nêu rõ phạm vi, đối tượng và cách thức nhận hỗ trợ (đầy đủ)")
    @JsonProperty("description_full")
    private String descriptionFull;

    @Size(max = 255)
    @Schema(example = "Nguyễn Văn A")
    private String managerName;

    @Size(max = 255)
    @Schema(example = "https://example.com/fund-logo.png")
    private String logoUrl;

    @NotNull
    @Min(1)
    @Schema(example = "1")
    private Integer organizationId;

    @NotNull
    @Min(1)
    @Schema(example = "1")
    private Integer fundReceivingInfoId;

    @NotNull
    @DecimalMin(value = "0.01", message = "Target amount must be greater than 0")
    @Schema(example = "50000.00")
    private BigDecimal targetAmount;

    @NotNull
    @Schema(example = "2026-04-01T00:00:00")
    private LocalDateTime timeStarted;

    @NotNull
    @Schema(example = "2026-12-31T23:59:59")
    private LocalDateTime timeEnded;

    /** Optional base64-encoded fund logo. When present, backend uploads and stores the resulting URL. */
    private String logoBase64;

    @Schema(example = "Học bổng sinh viên")
    private String topic;

    @NotBlank
    @Email
    @Schema(example = "manager@hcmus.edu.vn")
    private String managerEmail;
}
