package com.service.backend.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConversationRequestLatestMessageResponse {

    private Long id;
    private Long groupId;
    private Long senderMemberId;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime editedAt;
}
