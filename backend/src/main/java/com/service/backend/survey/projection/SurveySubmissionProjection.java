package com.service.backend.survey.projection;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.relational.core.mapping.Column;

/**
 * Projection for a survey submission joined with the responder's basic info.
 * {@code answersData} is the JSONB column projected as text.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SurveySubmissionProjection {
    private Long id;
    @Column("form_id")
    private Long formId;
    @Column("member_id")
    private Long memberId;
    @Column("member_name")
    private String memberName;
    @Column("member_email")
    private String memberEmail;
    @Column("answers_data")
    private String answersData;
    @Column("submitted_at")
    private LocalDateTime submittedAt;
}
