package com.service.backend.survey.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SurveySubmissionResponse {

    private Long id;
    private Long formId;
    private Long memberId;
    private String memberName;
    private String memberEmail;
    private Map<String, Object> answers;
    private LocalDateTime submittedAt;
}
