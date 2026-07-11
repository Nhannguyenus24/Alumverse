package com.service.backend.survey.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmitSurveyRequest {

    @Schema(description = "Map of questionId -> answer. Value is a String, a Number, or a list of option ids.",
            example = "{\"q_name\": \"Nguyễn Văn A\", \"q_dept\": \"opt_it\", \"q_benefit\": [\"opt_remote\", \"opt_gym\"]}")
    @NotNull(message = "Answers are required")
    private Map<String, Object> answers;
}
