package com.service.backend.survey.projection;

import java.time.LocalDateTime;

/**
 * Projection for a survey submission joined with the responder's basic info.
 * {@code answersData} is the JSONB column projected as text.
 */
public interface SurveySubmissionProjection {
    Long getId();
    Long getFormId();
    Long getMemberId();
    String getMemberName();
    String getMemberEmail();
    String getAnswersData();
    LocalDateTime getSubmittedAt();
}
