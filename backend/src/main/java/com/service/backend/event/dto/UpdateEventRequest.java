
package com.service.backend.event.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.validator.constraints.URL;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateEventRequest {

    @NotBlank()
    @Size(min = 3, max = 255)
    @Schema(example = "Hội thảo AI 2026 (Cập nhật)")
    private String title;

    @Size(max = 5000)
    @Schema(example = "Cập nhật thông tin sự kiện AI 2026.")
    private String description;

    @URL()
    @Schema(example = "https://example.com/banner-update.jpg")
    private String bannerUrl;

    @Size(max = 500)
    @Schema(example = "Hội trường B, Đại học Khoa học Tự nhiên")
    private String location;

    @NotNull(message = "Start time is required")
    @Schema(example = "2026-05-21T08:00:00")
    private LocalDateTime startTime;

    @NotNull(message = "End time is required")
    @Schema(example = "2026-05-21T17:00:00")
    private LocalDateTime endTime;

    @Schema(example = "2026-05-02T00:00:00")
    private LocalDateTime registrationStartAt;

    @Schema(example = "2026-05-19T23:59:59")
    private LocalDateTime registrationEndAt;

    @Min(value = 1)
    @Schema(example = "350")
    private Integer maxCapacity;

    /** Optional base64-encoded banner. When present, backend uploads and replaces bannerUrl. */
    private String bannerBase64;
}
