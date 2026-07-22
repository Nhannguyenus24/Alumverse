package com.service.backend.forum.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class CreateForumTopicSubscriptionRequest {
    @NotNull(message = "Topic ID is required")
    @NotNull

    @Min(value = 1)

    private Integer topicId;

    @NotNull(message = "Member ID is required")
    @NotNull

    @Min(value = 1)

    private Integer memberId;
}
