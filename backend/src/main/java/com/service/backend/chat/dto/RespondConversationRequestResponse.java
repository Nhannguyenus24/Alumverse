package com.service.backend.chat.dto;

import com.service.backend.shared.enums.ConversationRequestStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RespondConversationRequestResponse {

    private ConversationRequestStatus status;
    private String message;
}
