package com.service.backend.shared.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import com.service.backend.shared.enums.ChatMessageType;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("chat_messages")
public class ChatMessage {

    @Id
    private Integer id;

    @Column("group_id")
    private Integer groupId;

    @Column("sender_member_id")
    private Integer senderMemberId;


    private String content;

    @Column("message_type")
    private ChatMessageType messageType;

    /**
     * Raw JSON string mapped to PostgreSQL JSONB column.
     * Use a utility (e.g. JsonUtils) to parse/serialize as needed.
     */
    private String metadata;

    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("edited_at")
    private LocalDateTime editedAt;

    @Column("deleted_at")
    private LocalDateTime deletedAt;
}

