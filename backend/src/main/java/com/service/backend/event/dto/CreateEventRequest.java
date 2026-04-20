
package com.service.backend.event.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
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
public class CreateEventRequest {

    @NotBlank()
    @Size(min = 3, max = 255)
    @Schema(example = "Hội thảo AI 2026")
    private String title;

    @Size(max = 5000)
    @Schema(example = "Sự kiện chia sẻ về trí tuệ nhân tạo và ứng dụng thực tiễn năm 2026.")
    private String description;

    @URL()
    @Schema(example = "https://example.com/banner.jpg")
    private String bannerUrl;

    @Size(max = 500)
    @Schema(example = "Hội trường A, Đại học Khoa học Tự nhiên")
    private String location;

    @Schema(example = "2026-05-20T08:00:00")
    private LocalDateTime startTime;

    @Schema(example = "2026-05-20T17:00:00")
    private LocalDateTime endTime;

    @Schema(example = "2026-05-01T00:00:00")
    private LocalDateTime registrationStartAt;

    @Schema(example = "2026-05-18T23:59:59")
    private LocalDateTime registrationEndAt;

    @Min(value = 1)
    @Schema(example = "300")
    private Integer maxCapacity;

    /** Optional base64-encoded banner. When present, backend uploads and stores the resulting URL. */
    private String bannerBase64;
}
