package com.service.backend.chat.dao;

import com.service.backend.chat.entity.ChatMessage;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface ChatMessageRepository extends ReactiveCrudRepository<ChatMessage, Long> {

    @Query("""
            SELECT *
            FROM chat_messages
            WHERE group_id = :groupId
            ORDER BY created_at ASC
            LIMIT :limit OFFSET :offset
            """)
    Flux<ChatMessage> findByGroupIdWithPagination(Long groupId, int limit, int offset);

    @Query("""
            SELECT *
            FROM chat_messages
            WHERE group_id = :groupId
              AND deleted_at IS NULL
            ORDER BY created_at DESC
            LIMIT 1
            """)
    Mono<ChatMessage> findLastByGroupId(Long groupId);

    @Query("SELECT COUNT(*) FROM chat_messages WHERE group_id = :groupId")
    Mono<Long> countByGroupId(Long groupId);

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

