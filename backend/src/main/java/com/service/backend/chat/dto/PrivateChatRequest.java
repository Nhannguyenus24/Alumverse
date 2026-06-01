package com.service.backend.chat.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PrivateChatRequest {

    @NotNull(message = "Target member ID is required")
    @Min(value = 1, message = "Target member ID must be greater than 0")
    private Long targetMemberId;
}
