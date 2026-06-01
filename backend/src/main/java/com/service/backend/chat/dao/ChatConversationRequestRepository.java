package com.service.backend.chat.dao;

import com.service.backend.chat.entity.ChatConversationRequest;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface ChatConversationRequestRepository extends ReactiveCrudRepository<ChatConversationRequest, Long> {

    @Query("""
            SELECT id, member_low_id, member_high_id, requester_member_id, chat_group_id,
                   last_request_message_at, request_message_quota, cooldown_until, status,
                   created_at, updated_at
            FROM chat_conversation_requests
            WHERE member_low_id = :memberLowId
              AND member_high_id = :memberHighId
            LIMIT 1
            """)
    Mono<ChatConversationRequest> findByMemberPair(Long memberLowId, Long memberHighId);

    @Query("""
            SELECT id, member_low_id, member_high_id, requester_member_id, chat_group_id,
                   last_request_message_at, request_message_quota, cooldown_until, status,
                   created_at, updated_at
            FROM chat_conversation_requests
            WHERE chat_group_id = :chatGroupId
            LIMIT 1
            """)
    Mono<ChatConversationRequest> findByChatGroupId(Long chatGroupId);
}
