package com.service.backend.survey.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
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
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SurveyResponse {

    private Long id;
    private Long organizationId;
    private Long creatorMemberId;
    private String title;
    private String description;
    private List<SurveyQuestionDto> questions;
    private LocalDateTime startAt;
    private Integer durationMinutes;
    private LocalDateTime endAt;

    @Schema(description = "Stored status: DRAFT | OPEN | CLOSED")
    private String status;

    @Schema(description = "Status after applying the time window (OPEN past its end is reported as CLOSED)")
    private String effectiveStatus;

    private Boolean allowMultiple;
    private Long submissionCount;

    @Schema(description = "Only populated on user-facing endpoints: whether the current user already submitted")
    private Boolean hasSubmitted;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
