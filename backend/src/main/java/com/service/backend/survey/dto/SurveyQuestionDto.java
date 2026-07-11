package com.service.backend.survey.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * One question inside a survey's {@code questions_data} JSONB payload.
 * {@code type} accepts values from {@link com.service.backend.shared.enums.QuestionType}
 * (SHORT_TEXT, SINGLE_CHOICE, MULTI_CHOICE, DATE, NUMBER, RATING).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SurveyQuestionDto {

    @Schema(example = "q_dept")
    @NotBlank(message = "Question id is required")
    private String id;

    @Schema(example = "Phòng ban hiện tại của bạn")
    @NotBlank(message = "Question text is required")
    private String text;

    @Schema(example = "SINGLE_CHOICE",
            description = "SHORT_TEXT | SINGLE_CHOICE | MULTI_CHOICE | DATE | NUMBER | RATING")
    @NotBlank(message = "Question type is required")
    private String type;

    @JsonProperty("is_required")
    @Schema(example = "true")
    private Boolean isRequired;

    @Schema(description = "Only for SINGLE_CHOICE / MULTI_CHOICE questions")
    private List<SurveyOptionDto> options;
}
