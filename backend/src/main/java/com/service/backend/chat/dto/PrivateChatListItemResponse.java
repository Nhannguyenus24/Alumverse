package com.service.backend.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PrivateChatListItemResponse {

    private Long id;
    private String type;
    private String title;
    private Long createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long peerMemberId;
    private String peerUserName;
    private String peerAvatarUrl;
    private String lastMessagePreview;
    private LocalDateTime lastMessageAt;
}
