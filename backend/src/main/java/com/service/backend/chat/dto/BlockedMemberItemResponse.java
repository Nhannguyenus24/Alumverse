package com.service.backend.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BlockedMemberItemResponse {

    private Long blockedMemberId;
    private String fullName;
    private String avatarUrl;
    private LocalDateTime blockedAt;
}
