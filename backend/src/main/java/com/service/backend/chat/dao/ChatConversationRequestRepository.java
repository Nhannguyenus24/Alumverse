package com.service.backend.chat.dao;

import com.service.backend.chat.dto.ConversationRequestSearchItemResponse;
import com.service.backend.shared.entity.ChatConversationRequest;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface ChatConversationRequestRepository extends R2dbcRepository<ChatConversationRequest, Long> {

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

    String SEARCH_FROM_JOIN = """
            FROM chat_conversation_requests ccr
            JOIN users u ON u.id = CASE
                WHEN ccr.requester_member_id = :currentUserId THEN ccr.target_member_id
                ELSE ccr.requester_member_id
            END
            JOIN chat_messages cm ON cm.id = ccr.last_request_message_id
            """;

    String SEARCH_WHERE = """
            WHERE (ccr.target_member_id = :currentUserId OR ccr.requester_member_id = :currentUserId)
              AND (
                    ccr.status = 'PENDING'
                    OR (ccr.status = 'REJECTED' AND ccr.target_member_id = :currentUserId)
                  )
              AND u.status = 'ACTIVE'
              AND (:fullName IS NULL OR LOWER(u.full_name) LIKE LOWER(:fullName))
              AND (
                    :status IS NULL
                    OR (:status = 'PENDING' AND ccr.status = 'PENDING' AND ccr.target_member_id = :currentUserId)
                    OR (:status = 'SENT' AND ccr.status = 'PENDING' AND ccr.requester_member_id = :currentUserId)
                    OR (:status = 'REJECTED' AND ccr.status = 'REJECTED' AND ccr.target_member_id = :currentUserId)
                  )
            """;

    String SEARCH_ORDER = """
            ORDER BY CASE
                WHEN ccr.status = 'PENDING' AND ccr.target_member_id = :currentUserId THEN 0
                WHEN ccr.status = 'PENDING' AND ccr.requester_member_id = :currentUserId THEN 1
                WHEN ccr.status = 'REJECTED' THEN 2
                ELSE 3
            END,
            cm.created_at DESC
            """;

    @Query("""
            SELECT COUNT(1) > 0
            FROM users
            WHERE id = :userId
              AND status = 'ACTIVE'
            """)
    Mono<Boolean> existsActiveUserById(Long userId);

    @Query("""
            SELECT ccr.id,
                   ccr.requester_member_id,
                   CASE
                       WHEN ccr.requester_member_id = :currentUserId THEN ccr.target_member_id
                       ELSE ccr.requester_member_id
                   END AS peer_member_id,
                   u.full_name,
                   u.avatar_url,
                   ccr.status,
                   CASE
                       WHEN ccr.status = 'PENDING' AND ccr.target_member_id = :currentUserId THEN 'INCOMING'
                       WHEN ccr.status = 'PENDING' AND ccr.requester_member_id = :currentUserId THEN 'OUTGOING'
                       WHEN ccr.status = 'REJECTED' AND ccr.target_member_id = :currentUserId THEN 'REJECTED_INCOMING'
                   END AS request_direction,
                   cm.content       AS message,
                   cm.created_at    AS message_created_at
            """ + SEARCH_FROM_JOIN + SEARCH_WHERE + """
            """ + SEARCH_ORDER + """
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
