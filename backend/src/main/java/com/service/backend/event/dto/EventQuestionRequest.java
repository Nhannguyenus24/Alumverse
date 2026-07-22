package com.service.backend.event.dto;

import com.service.backend.shared.enums.QuestionType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventQuestionRequest {

    @NotNull
    @Schema(example = "SHORT_TEXT")
    private QuestionType type;

    @NotBlank
    @Schema(example = "Bạn thuộc khóa nào?")
    @Size(max = 255)

    private String label;

    @Schema(example = "[\"K2019\", \"K2020\", \"K2021\"]")
    @Size(max = 100)

    private List<String> options;

    @Schema(example = "true")
    private Boolean required;

    @Schema(example = "0")
    private Integer orderIndex;
}
