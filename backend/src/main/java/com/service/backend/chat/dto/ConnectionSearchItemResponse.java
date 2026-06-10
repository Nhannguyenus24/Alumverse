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
public class ConnectionSearchItemResponse {

    private Long connectionId;
    private Long chatGroupId;
    private Long peerMemberId;
    private String fullName;
    private String avatarUrl;
    private String program;
    private String major;
    private LocalDateTime connectedAt;
}
