package com.service.backend.forum.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateForumTopicSubscriptionRequest {
    @NotNull(message = "Topic ID is required")
    private Integer topicId;

    @NotNull(message = "Member ID is required")
    private Integer memberId;
}
