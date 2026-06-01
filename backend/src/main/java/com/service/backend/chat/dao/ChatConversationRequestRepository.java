package com.service.backend.chat.dao;

import com.service.backend.chat.dto.ConversationRequestSearchItemResponse;
import com.service.backend.shared.entity.ChatConversationRequest;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface ChatConversationRequestRepository extends ReactiveCrudRepository<ChatConversationRequest, Long> {

    @Query("""
            SELECT id, member_low_id, member_high_id, requester_member_id, target_member_id, chat_group_id,
                   last_request_message_id, cooldown_until, status,
                   created_at, updated_at
            FROM chat_conversation_requests
            WHERE member_low_id = :memberLowId
              AND member_high_id = :memberHighId
            LIMIT 1
            """)
    Mono<ChatConversationRequest> findByMemberPair(Long memberLowId, Long memberHighId);

    @Query("""
            SELECT id, member_low_id, member_high_id, requester_member_id, target_member_id, chat_group_id,
                   last_request_message_id, cooldown_until, status,
                   created_at, updated_at
            FROM chat_conversation_requests
            WHERE chat_group_id = :chatGroupId
            LIMIT 1
            """)
    Mono<ChatConversationRequest> findByChatGroupId(Long chatGroupId);

    String SEARCH_FROM_JOIN = """
            FROM chat_conversation_requests ccr
            JOIN users u             ON u.id        = ccr.requester_member_id
            JOIN global_profiles gp  ON gp.user_id  = ccr.requester_member_id
            JOIN chat_messages cm    ON cm.id        = ccr.last_request_message_id
            """;

    String SEARCH_WHERE = """
            WHERE ccr.target_member_id = :currentUserId
              AND (:fullName IS NULL OR LOWER(gp.full_name) LIKE LOWER(:fullName))
              AND (:status IS NULL OR ccr.status = :status)
            """;

    @Query("""
            SELECT ccr.id,
                   ccr.requester_member_id,
                   gp.full_name,
                   u.avatar_url,
                   ccr.status,
                   cm.content       AS message,
                   cm.created_at    AS message_created_at
            """ + SEARCH_FROM_JOIN + SEARCH_WHERE + """
            ORDER BY cm.created_at DESC
            LIMIT :limit OFFSET :offset
            """)
    Flux<ConversationRequestSearchItemResponse> searchIncomingRequests(
            Long currentUserId,
            String fullName,
            String status,
            int limit,
            int offset);

    @Query("SELECT COUNT(ccr.id) " + SEARCH_FROM_JOIN + SEARCH_WHERE)
    Mono<Long> countIncomingRequests(
            Long currentUserId,
            String fullName,
            String status);
}
