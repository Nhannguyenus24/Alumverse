package com.service.backend.event.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnswerItem {

    @Schema(example = "1")
    private Integer questionId;

    @Schema(description = "String for SHORT_TEXT/SINGLE_CHOICE; array of strings for MULTI_CHOICE")
    private Object value;
}
