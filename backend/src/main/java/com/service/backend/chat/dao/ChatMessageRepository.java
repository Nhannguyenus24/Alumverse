package com.service.backend.chat.dao;

import com.service.backend.chat.dto.ChatMessageResponse;
import com.service.backend.shared.entity.ChatMessage;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface ChatMessageRepository extends ReactiveCrudRepository<ChatMessage, Long> {
    @Query("""
            SELECT cm.id,
                   cm.group_id,
                   cm.sender_member_id,
                   cm.content,
                   cm.message_type,
                   cm.metadata::text AS metadata,
                   cm.created_at,
                   cm.edited_at,
                   cm.deleted_at,
                   u.full_name    AS sender_full_name,
                   u.avatar_url   AS sender_avatar_url
            FROM chat_messages cm
            LEFT JOIN users u ON u.id = cm.sender_member_id
            WHERE cm.group_id = :groupId
            ORDER BY cm.created_at DESC
            LIMIT :limit OFFSET :offset
            """)
    Flux<ChatMessageResponse> findByGroupIdWithSenderInfoAndPagination(Long groupId, int limit, int offset);

    @Query("""
            SELECT id, group_id, sender_member_id, content, created_at, edited_at, deleted_at
            FROM chat_messages
            WHERE group_id = :groupId
              AND sender_member_id = :senderMemberId
              AND deleted_at IS NULL
            ORDER BY created_at DESC
            LIMIT 1
            """)
    Mono<ChatMessage> findLatestByGroupIdAndSenderMemberId(Long groupId, Long senderMemberId);

    @Query("""
            INSERT INTO chat_messages (group_id, sender_member_id, content, message_type, metadata, created_at)
            VALUES (:groupId, :senderMemberId, :content, :messageType, CAST(:metadata AS jsonb), :createdAt)
            RETURNING id, group_id, sender_member_id, content, message_type, metadata::text AS metadata, created_at, edited_at, deleted_at
            """)
    Mono<ChatMessage> insertMessage(
            Long groupId,
            Long senderMemberId,
            String content,
            String messageType,
            String metadata,
            java.time.LocalDateTime createdAt
    );

    @Modifying
    @Query("DELETE FROM chat_messages WHERE group_id = :groupId")
    Mono<Void> deleteByGroupId(Long groupId);
}

