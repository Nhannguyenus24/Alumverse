package com.service.backend.chat.dao;

import com.service.backend.chat.dto.ConnectionSearchItemResponse;
import com.service.backend.shared.entity.ChatConversationRequest;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface ConnectionSearchRepository extends ReactiveCrudRepository<ChatConversationRequest, Long> {

    String CONNECTIONS_BASE =
            "FROM ( "
            + "  SELECT ccr.id, ccr.chat_group_id, ccr.updated_at, "
            + "    CASE WHEN ccr.member_low_id = :currentUserId "
            + "         THEN ccr.member_high_id ELSE ccr.member_low_id END AS peer_id "
            + "  FROM chat_conversation_requests ccr "
            + "  WHERE ccr.status = 'ACCEPTED' "
            + "    AND (ccr.member_low_id = :currentUserId OR ccr.member_high_id = :currentUserId) "
            + ") conn "
            + "JOIN users u ON u.id = conn.peer_id "
            + "LEFT JOIN global_profiles gp ON gp.user_id = conn.peer_id "
            + "JOIN organization_members om ON om.user_id = conn.peer_id "
            + "  AND om.organization_id = :organizationId ";

    String SEARCH_WHERE =
            "WHERE (:fullName IS NULL OR LOWER(gp.full_name) LIKE LOWER(:fullName)) ";

    String SEARCH_SELECT =
            "SELECT conn.id AS connection_id, "
            + "conn.chat_group_id AS chat_group_id, "
            + "conn.peer_id AS peer_member_id, "
            + "gp.full_name AS full_name, "
            + "u.avatar_url AS avatar_url, "
            + "om.program AS program, "
            + "om.major AS major, "
            + "conn.updated_at AS connected_at ";

    @Query(SEARCH_SELECT + CONNECTIONS_BASE + SEARCH_WHERE
            + "ORDER BY conn.updated_at DESC "
            + "LIMIT :limit OFFSET :offset")
    Flux<ConnectionSearchItemResponse> searchConnections(
            Integer organizationId,
            Long currentUserId,
            String fullName,
            int limit,
            int offset);

    @Query("SELECT COUNT(conn.id) " + CONNECTIONS_BASE + SEARCH_WHERE)
    Mono<Long> countConnections(
            Integer organizationId,
            Long currentUserId,
            String fullName);
}
