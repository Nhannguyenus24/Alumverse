package com.service.backend.mentorship.dto;

import com.service.backend.shared.entity.SessionFeedback;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionFeedbackResponse {

    private Integer id;
    private Integer sessionId;
    private Integer menteeMemberId;
    private Integer rating;
    private String comment;
    private Boolean isPublic;
    private LocalDateTime createdAt;

    public static SessionFeedbackResponse from(SessionFeedback feedback) {
        return SessionFeedbackResponse.builder()
                .id(feedback.getId())
                .sessionId(feedback.getSessionId())
                .menteeMemberId(feedback.getMenteeMemberId())
                .rating(feedback.getRating())
                .comment(feedback.getComment())
                .isPublic(feedback.getIsPublic())
                .createdAt(feedback.getCreatedAt())
                .build();
    }
}
