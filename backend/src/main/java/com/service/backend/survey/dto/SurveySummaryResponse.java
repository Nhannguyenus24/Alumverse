package com.service.backend.survey.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Aggregated results for a survey, computed per question.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SurveySummaryResponse {

    private Long surveyId;
    private String title;
    private Long totalSubmissions;
    private List<QuestionSummary> questions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class QuestionSummary {
        private String questionId;
        private String text;
        private String type;

        /** For SINGLE_CHOICE / MULTI_CHOICE: count per option. */
        private List<OptionCount> optionCounts;

        /** For SHORT_TEXT / DATE: the raw answers. */
        private List<String> textAnswers;

        /** For NUMBER / RATING: numeric stats. */
        private NumericStats numericStats;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OptionCount {
        private String optionId;
        private String optionText;
        private long count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NumericStats {
        private long count;
        private double average;
        private double min;
        private double max;
    }
}
