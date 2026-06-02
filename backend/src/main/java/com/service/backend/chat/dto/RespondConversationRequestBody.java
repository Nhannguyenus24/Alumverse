package com.service.backend.chat.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RespondConversationRequestBody {

    @NotNull(message = "Conversation request ID is required")
    @Min(value = 1, message = "Conversation request ID must be greater than 0")
    private Long id;

    @NotBlank(message = "Status is required")
    @Pattern(regexp = "^(ACCEPTED|REJECTED)$", message = "Status must be ACCEPTED or REJECTED")
    private String status;
}
