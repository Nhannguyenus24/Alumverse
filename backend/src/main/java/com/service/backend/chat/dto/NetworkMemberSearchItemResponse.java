package com.service.backend.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NetworkMemberSearchItemResponse {

    private Integer userId;
    private String fullName;
    private String program;
    private String major;
    private String avatarUrl;
    // Connection status between the current user and this member, derived from
    // chat_conversation_requests (PENDING / ACCEPTED / REJECTED). Null when the
    // two have never exchanged a connection request.
    private String connectionStatus;
}
