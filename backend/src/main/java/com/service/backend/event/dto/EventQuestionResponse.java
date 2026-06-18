package com.service.backend.event.dto;

import com.service.backend.shared.entity.EventQuestion;
import com.service.backend.shared.enums.QuestionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventQuestionResponse {

    private Integer id;
    private Long eventId;
    private QuestionType type;
    private String label;
    private List<String> options;
    private Boolean required;
    private Integer orderIndex;

    public static EventQuestionResponse from(EventQuestion question) {
        return EventQuestionResponse.builder()
                .id(question.getId())
                .eventId(question.getEventId())
                .type(question.getType())
                .label(question.getLabel())
                .options(question.getOptions())
                .required(question.getRequired())
                .orderIndex(question.getOrderIndex())
                .build();
    }
}
