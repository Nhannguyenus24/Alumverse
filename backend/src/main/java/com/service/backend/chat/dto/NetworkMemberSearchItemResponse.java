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
    // True when there is a PENDING request this member sent TO the current user
    // (current user is the target). The UI shows an "accept/connect" affordance
    // instead of "waiting", since sending back auto-accepts and connects the pair.
    private Boolean incoming;
}
