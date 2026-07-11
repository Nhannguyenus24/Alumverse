package com.service.backend.survey.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SurveyInsightResponse {

    private Long surveyId;
    private Long totalSubmissions;

    /** AI-generated (or fallback) insight text, in Vietnamese. */
    private String insight;

    /** false when the Gemini API key is absent and a local fallback message was returned. */
    private Boolean generatedByAi;
}
