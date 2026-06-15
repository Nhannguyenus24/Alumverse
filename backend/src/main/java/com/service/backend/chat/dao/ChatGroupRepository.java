package com.service.backend.chat.dao;

import com.service.backend.chat.dto.GroupChatListItemResponse;
import com.service.backend.chat.dto.PrivateChatListItemResponse;
import com.service.backend.shared.entity.ChatGroup;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface ChatGroupRepository extends ReactiveCrudRepository<ChatGroup, Long> {


    @Query("""
            SELECT cg.*
            FROM chat_groups cg
            WHERE cg.type = 'PRIVATE'
              AND cg.id IN (
                  SELECT group_id
                  FROM chat_group_members
                  WHERE member_id IN (:memberAId, :memberBId)
                  GROUP BY group_id
                  HAVING COUNT(*) = 2
              )
            LIMIT 1
            """)
    Mono<ChatGroup> findPrivateChatBetweenMembers(Long memberAId, Long memberBId);

    @Query("""
            SELECT
                cg.id AS id,
                cg.type AS type,
                cg.title AS title,
                cg.created_by AS created_by,
                cg.created_at AS created_at,
                cg.updated_at AS updated_at,
                peer_cgm.member_id AS peer_member_id,
                gp.full_name AS peer_user_name,
                u.avatar_url AS peer_avatar_url,
                lm.content AS last_message_preview,
                lm.created_at AS last_message_at,
                EXISTS (
                    SELECT 1 FROM user_blocks ub
                    WHERE ub.blocker_member_id = :memberId AND ub.blocked_member_id = peer_cgm.member_id
                ) AS blocked_by_me,
                EXISTS (
                    SELECT 1 FROM user_blocks ub
                    WHERE ub.blocker_member_id = peer_cgm.member_id AND ub.blocked_member_id = :memberId
                ) AS blocked_by_peer
            FROM chat_group_members my_cgm
            JOIN chat_groups cg ON cg.id = my_cgm.group_id
            LEFT JOIN chat_group_members peer_cgm
                ON peer_cgm.group_id = cg.id AND peer_cgm.member_id <> :memberId
            LEFT JOIN users u ON u.id = peer_cgm.member_id
            LEFT JOIN global_profiles gp ON gp.user_id = peer_cgm.member_id
            LEFT JOIN LATERAL (
                SELECT content, created_at
                FROM chat_messages
                WHERE group_id = cg.id AND deleted_at IS NULL
                ORDER BY created_at DESC
                LIMIT 1
            ) lm ON true
            WHERE my_cgm.member_id = :memberId
              AND cg.type = 'PRIVATE'
              AND (:text IS NULL OR :text = '' OR LOWER(gp.full_name) LIKE '%' || LOWER(:text) || '%')
            ORDER BY COALESCE(lm.created_at, cg.updated_at) DESC
            LIMIT :limit OFFSET :offset
            """)
    Flux<PrivateChatListItemResponse> findPrivateChatsWithSummary(Long memberId, String text, int limit, int offset);

    @Query("""
            SELECT COUNT(cg.id)
            FROM chat_group_members my_cgm
            JOIN chat_groups cg ON cg.id = my_cgm.group_id
            LEFT JOIN chat_group_members peer_cgm
                ON peer_cgm.group_id = cg.id AND peer_cgm.member_id <> :memberId
            LEFT JOIN global_profiles gp ON gp.user_id = peer_cgm.member_id
            WHERE my_cgm.member_id = :memberId
              AND cg.type = 'PRIVATE'
              AND (:text IS NULL OR :text = '' OR LOWER(gp.full_name) LIKE '%' || LOWER(:text) || '%')
            """)
    Mono<Long> countPrivateChats(Long memberId, String text);

    @Query("""
            SELECT
                cg.id AS id,
                cg.type AS type,
                cg.title AS title,
                cg.created_by AS created_by,
                cg.created_at AS created_at,
                cg.updated_at AS updated_at,
                (SELECT COUNT(1) FROM chat_group_members WHERE group_id = cg.id) AS member_count,
                lm.content AS last_message_preview,
                lm.created_at AS last_message_at
            FROM chat_group_members my_cgm
            JOIN chat_groups cg ON cg.id = my_cgm.group_id
            LEFT JOIN LATERAL (
                SELECT content, created_at
                FROM chat_messages
                WHERE group_id = cg.id AND deleted_at IS NULL
                ORDER BY created_at DESC
                LIMIT 1
            ) lm ON true
            WHERE my_cgm.member_id = :memberId
              AND cg.type = 'GROUP'
              AND (:text IS NULL OR :text = '' OR LOWER(cg.title) LIKE '%' || LOWER(:text) || '%')
            ORDER BY COALESCE(lm.created_at, cg.updated_at) DESC
            LIMIT :limit OFFSET :offset
            """)
    Flux<GroupChatListItemResponse> findGroupChatsWithSummary(Long memberId, String text, int limit, int offset);

    @Query("""
            SELECT COUNT(cg.id)
            FROM chat_group_members my_cgm
            JOIN chat_groups cg ON cg.id = my_cgm.group_id
            WHERE my_cgm.member_id = :memberId
              AND cg.type = 'GROUP'
              AND (:text IS NULL OR :text = '' OR LOWER(cg.title) LIKE '%' || LOWER(:text) || '%')
            """)
    Mono<Long> countGroupChats(Long memberId, String text);
}

