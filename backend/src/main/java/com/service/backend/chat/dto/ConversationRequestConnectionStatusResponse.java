package com.service.backend.chat.dto;

import com.service.backend.shared.enums.Status;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConversationRequestConnectionStatusResponse {

    private Status status;
    private LocalDateTime cooldownUntil;
    private ConversationRequestLatestMessageResponse latestMessage;
}
