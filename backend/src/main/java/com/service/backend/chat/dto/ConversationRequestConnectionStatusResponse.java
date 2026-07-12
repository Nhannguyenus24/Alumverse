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

    /**
     * Whether the target member is verified (verification_level &gt;= 2) in the requester's
     * current organization. False means a new/resent request would be rejected by the backend
     * gate in {@code ChatConversationRequestService.createConversationRequest} — the frontend
     * uses this to block composing and warn the user as soon as the drawer opens, instead of
     * waiting for the send to fail.
     */
    private boolean targetVerified;
}
