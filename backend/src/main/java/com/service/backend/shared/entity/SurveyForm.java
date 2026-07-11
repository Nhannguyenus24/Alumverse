package com.service.backend.shared.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.type.TypeReference;
import com.service.backend.survey.dto.SurveyQuestionDto;
import com.service.backend.shared.utils.JsonUtils;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Survey form entity. The {@code questions_data} column is PostgreSQL JSONB.
 * Following the codebase convention (see {@link ChatMessage}), JSONB is mapped to a
 * String field: written via explicit {@code CAST(:x AS jsonb)} queries and read via
 * {@code questions_data::text}. Reads should therefore always use the explicit column
 * projections defined in the repository (never a bare {@code SELECT *}).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("survey_forms")
public class SurveyForm {

    @Id
    private Long id;

    @Column("organization_id")
    private Long organizationId;

    @Column("creator_member_id")
    private Long creatorMemberId;

    private String title;

    private String description;

    @JsonIgnore
    @Column("questions_data")
    private String questionsDataJson;

    @Column("start_at")
    private LocalDateTime startAt;

    @Column("duration_minutes")
    private Integer durationMinutes;

    private String status;

    @Column("allow_multiple")
    private Boolean allowMultiple;

    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column("updated_at")
    private LocalDateTime updatedAt;

    @JsonProperty("questions")
    public List<SurveyQuestionDto> getQuestions() {
        if (questionsDataJson == null || questionsDataJson.isBlank()) return List.of();
        return JsonUtils.fromJson(questionsDataJson, new TypeReference<List<SurveyQuestionDto>>() {});
    }

    public void setQuestions(List<SurveyQuestionDto> questions) {
        this.questionsDataJson = questions == null ? "[]" : JsonUtils.toJson(questions);
    }
}
