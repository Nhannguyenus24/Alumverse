package com.service.backend.chat.repository;

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

    @Query("SELECT COUNT(*) FROM chat_messages WHERE group_id = :groupId")
    Mono<Long> countByGroupId(Long groupId);

    @Modifying
    @Query("DELETE FROM chat_messages WHERE group_id = :groupId")
    Mono<Void> deleteByGroupId(Long groupId);
}

