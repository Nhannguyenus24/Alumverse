package com.service.backend.chat.dao;

import com.service.backend.chat.dto.ConnectionSearchItemResponse;
import com.service.backend.shared.entity.ChatConversationRequest;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface ConnectionSearchRepository extends R2dbcRepository<ChatConversationRequest, Long> {

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
            // Connections are org-agnostic; program/major only exist on organization_members.
            // A peer may belong to >1 organization, so pick a single membership via LATERAL to
            // keep the join 1:1 (avoids duplicate connection rows / inflated counts). LEFT so a
            // peer with no membership still appears (program/major null).
            + "LEFT JOIN LATERAL ( "
            + "  SELECT om.program, om.major "
            + "  FROM organization_members om "
            + "  WHERE om.user_id = conn.peer_id "
            + "  ORDER BY om.id "
            + "  LIMIT 1 "
            + ") om ON true ";

    String SEARCH_WHERE =
            "WHERE (:fullName IS NULL OR LOWER(u.full_name) LIKE LOWER(:fullName)) ";

    String SEARCH_SELECT =
            "SELECT conn.id AS connection_id, "
            + "conn.chat_group_id AS chat_group_id, "
            + "conn.peer_id AS peer_member_id, "
            + "u.full_name AS full_name, "
            + "u.avatar_url AS avatar_url, "
            + "CAST(om.program AS text) AS program, "
            + "CAST(om.major AS text) AS major, "
            + "conn.updated_at AS connected_at ";

    @Query(SEARCH_SELECT + CONNECTIONS_BASE + SEARCH_WHERE
            + "ORDER BY conn.updated_at DESC "
            + "LIMIT :limit OFFSET :offset")
    Flux<ConnectionSearchItemResponse> searchConnections(
            Long currentUserId,
            String fullName,
            int limit,
            int offset);

    @Query("SELECT COUNT(conn.id) " + CONNECTIONS_BASE + SEARCH_WHERE)
    Mono<Long> countConnections(
            Long currentUserId,
            String fullName);
}
