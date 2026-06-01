package com.service.backend.chat.dto;

import com.service.backend.shared.entity.ChatGroupMember;
import com.service.backend.shared.enums.ChatType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatGroupMetadataResponse {
    private Long id;
    private ChatType type;
    private String title;
    private Long createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<ChatGroupMember> members;
}
