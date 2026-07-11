package com.service.backend.survey.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateSurveyRequest {

    @Schema(example = "Khảo sát nhân sự 2026")
    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must be at most 255 characters")
    private String title;

    @Schema(example = "Đánh giá mức độ hài lòng về môi trường làm việc")
    private String description;

    @Schema(description = "Organization the survey belongs to. Ignored for STAFF (forced to own org).")
    private Long organizationId;

    @Valid
    @NotNull(message = "Questions are required")
    @Size(min = 1, message = "At least one question is required")
    private List<SurveyQuestionDto> questions;

    @Schema(example = "2026-08-01T09:00:00")
    @NotNull(message = "Start time is required")
    private LocalDateTime startAt;

    @Schema(example = "1440", description = "Duration in minutes; end time = startAt + duration")
    @NotNull(message = "Duration is required")
    @Min(value = 1, message = "Duration must be at least 1 minute")
    private Integer durationMinutes;

    @Schema(example = "false", description = "Allow a user to submit more than once")
    private Boolean allowMultiple;
}
