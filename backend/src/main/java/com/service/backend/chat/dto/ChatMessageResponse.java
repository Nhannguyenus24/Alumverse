package com.service.backend.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageResponse {

    private Long id;
    private Long groupId;
    private Long senderMemberId;
    private String senderFullName;
    private String senderAvatarUrl;
    private String content;
    private String messageType;
    private String metadata;
    private LocalDateTime createdAt;
    private LocalDateTime editedAt;
    private LocalDateTime deletedAt;
    // True when every other group member has read this message (i.e. their last_read_at is at or
    // after this message's created_at). For a private chat that means the peer has seen it. Drives
    // the "Sent" vs "Seen" indicator on the sender's own latest message.
    private Boolean seenByPeer;
}
