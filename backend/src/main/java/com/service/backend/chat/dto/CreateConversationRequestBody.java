package com.service.backend.chat.dto;

import com.service.backend.shared.validation.ChatMessageLimits;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateConversationRequestBody {

    @NotNull(message = "Target member ID is required")
    @Min(value = 1, message = "Target member ID must be greater than 0")
    private Long targetMemberId;

    @NotBlank(message = "Message is required")
    @Size(max = ChatMessageLimits.MAX_MESSAGE_LENGTH, message = "Tin nhắn không được vượt quá 200 ký tự")
    private String message;
}
