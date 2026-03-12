package com.service.backend.chat.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;


public record PrivateChatRequest(
        @NotNull(message = "Target member ID is required")
        @Min(value = 1, message = "Target member ID must be greater than 0")
        Long targetMemberId
) {
}
