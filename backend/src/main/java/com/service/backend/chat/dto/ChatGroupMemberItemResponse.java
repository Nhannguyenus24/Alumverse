package com.service.backend.chat.dto;

import com.service.backend.shared.enums.ChatRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatGroupMemberItemResponse {

    private Long memberId;
    private String fullName;
    private String avatarUrl;
    private ChatRole role;
    private LocalDateTime joinedAt;
}
