package com.service.backend.survey.dto;

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

/**
 * Update payload. Only permitted while the survey is in DRAFT status.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSurveyRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must be at most 255 characters")
    private String title;

    private String description;

    @Valid
    @NotNull(message = "Questions are required")
    @Size(min = 1, message = "At least one question is required")
    private List<SurveyQuestionDto> questions;

    @NotNull(message = "Start time is required")
    private LocalDateTime startAt;

    @NotNull(message = "Duration is required")
    @Min(value = 1, message = "Duration must be at least 1 minute")
    private Integer durationMinutes;

    private Boolean allowMultiple;
}
