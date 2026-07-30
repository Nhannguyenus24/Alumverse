package com.service.backend.chat.dto;

import com.service.backend.shared.enums.ConversationRequestStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConversationRequestConnectionStatusResponse {

    private ConversationRequestStatus status;
    private LocalDateTime cooldownUntil;
    private ConversationRequestLatestMessageResponse latestMessage;
    private String requestDirection;
    /**
     * True when there is a PENDING request that the OTHER member sent TO the current user
     * (i.e. the current user is the target). The UI uses this to let the current user send
     * back, which auto-accepts and connects the pair instead of stacking a second request.
     */
    private boolean incoming;
}
