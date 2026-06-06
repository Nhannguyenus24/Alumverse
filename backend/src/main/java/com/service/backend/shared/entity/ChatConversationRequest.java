package com.service.backend.shared.entity;

import com.service.backend.shared.enums.ConversationRequestStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("chat_conversation_requests")
public class ChatConversationRequest {

    @Id
    private Long id;

    @Column("member_low_id")
    private Long memberLowId;

    @Column("member_high_id")
    private Long memberHighId;

    @Column("requester_member_id")
    private Long requesterMemberId;

    @Column("target_member_id")
    private Long targetMemberId;

    @Column("chat_group_id")
    private Long chatGroupId;

    @Column("last_request_message_id")
    private Long lastRequestMessageId;

    @Column("cooldown_until")
    private LocalDateTime cooldownUntil;

    private ConversationRequestStatus status;

    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column("updated_at")
    private LocalDateTime updatedAt;
}
