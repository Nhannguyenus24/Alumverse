package com.service.backend.shared.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.service.backend.shared.utils.JsonUtils;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * A user's submission to a survey. {@code answers_data} is a PostgreSQL JSONB column,
 * mapped to a String field following the codebase convention (write via
 * {@code CAST(:x AS jsonb)}, read via {@code answers_data::text}).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("survey_submissions")
public class SurveySubmission {

    @Id
    private Long id;

    @Column("form_id")
    private Long formId;

    @Column("member_id")
    private Long memberId;

    @JsonIgnore
    @Column("answers_data")
    private String answersDataJson;

    @CreatedDate
    @Column("submitted_at")
    private LocalDateTime submittedAt;

    @JsonProperty("answers")
    public Map<String, Object> getAnswers() {
        if (answersDataJson == null || answersDataJson.isBlank()) return Map.of();
        return JsonUtils.fromJsonToMap(answersDataJson);
    }

    public void setAnswers(Map<String, Object> answers) {
        this.answersDataJson = answers == null ? "{}" : JsonUtils.toJson(answers);
    }
}
