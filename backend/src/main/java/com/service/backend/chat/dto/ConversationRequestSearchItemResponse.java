package com.service.backend.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationRequestSearchItemResponse {

    private Long id;
    private Long requesterMemberId;
    private Long peerMemberId;
    private String fullName;
    private String avatarUrl;
    private String status;
    private String requestDirection;
    private String message;
    private LocalDateTime messageCreatedAt;
}
