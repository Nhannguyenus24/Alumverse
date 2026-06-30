package com.service.backend.chat.dao;

import com.service.backend.chat.dto.ChatGroupMemberItemResponse;
import com.service.backend.chat.dto.RecentChatPreviewResponse;
import com.service.backend.shared.entity.ChatGroupMember;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface ChatGroupMemberRepository extends ReactiveCrudRepository<ChatGroupMember, Long> {

    @Query("SELECT * FROM chat_group_members WHERE member_id = :memberId")
    Flux<ChatGroupMember> findByMemberId(Long memberId);

    @Query("SELECT * FROM chat_group_members WHERE group_id = :groupId")
    Flux<ChatGroupMember> findByGroupId(Long groupId);

    @Query("SELECT * FROM chat_group_members WHERE group_id = :groupId AND member_id = :memberId LIMIT 1")
    Mono<ChatGroupMember> findByGroupIdAndMemberId(Long groupId, Long memberId);

    @Modifying
    @Query("DELETE FROM chat_group_members WHERE group_id = :groupId AND member_id = :memberId")
    Mono<Void> deleteByGroupIdAndMemberId(Long groupId, Long memberId);

    @Modifying
    @Query("UPDATE chat_group_members SET role = 'OWNER' WHERE group_id = :groupId AND member_id = :memberId")
    Mono<Void> updateRoleToOwnerByGroupIdAndMemberId(Long groupId, Long memberId);

    @Modifying
    @Query("DELETE FROM chat_group_members WHERE group_id = :groupId")
    Mono<Void> deleteByGroupId(Long groupId);

    @Query("""
            SELECT
                cg.id                                                                   AS id,
                CASE WHEN cg.type = 'PRIVATE' THEN u.full_name ELSE cg.title END        AS name,
                CASE WHEN cg.type = 'PRIVATE' THEN u.avatar_url  ELSE NULL END         AS avatar_url,
                lm.content                                                              AS preview,
                lm.created_at                                                           AS updated_at,
                cg.type                                                                 AS type
            FROM chat_group_members my_cgm
            JOIN chat_groups cg ON cg.id = my_cgm.group_id
            JOIN LATERAL (
                SELECT content, created_at
                FROM chat_messages
                WHERE group_id = cg.id
                  AND deleted_at IS NULL
                ORDER BY created_at DESC
                LIMIT 1
            ) lm ON true
            LEFT JOIN chat_group_members peer_cgm
                ON peer_cgm.group_id  = cg.id
               AND peer_cgm.member_id <> :memberId
               AND cg.type            = 'PRIVATE'
            LEFT JOIN users           u  ON u.id         = peer_cgm.member_id
            WHERE my_cgm.member_id = :memberId
            ORDER BY lm.created_at DESC
            LIMIT 5
            """)
    Flux<RecentChatPreviewResponse> findTop5RecentChatPreviewsByMemberId(Long memberId);

    @Query("""
            SELECT cgm.member_id AS member_id,
                   u.full_name AS full_name,
                   u.avatar_url AS avatar_url,
                   cgm.role AS role,
                   cgm.joined_at AS joined_at
            FROM chat_group_members cgm
            INNER JOIN users u ON u.id = cgm.member_id
            WHERE cgm.group_id = :groupId
              AND (:namePattern IS NULL OR LOWER(u.full_name) LIKE LOWER(:namePattern))
            ORDER BY CASE cgm.role WHEN 'OWNER' THEN 0 ELSE 1 END,
                     cgm.joined_at ASC
            LIMIT :limit OFFSET :offset
            """)
    Flux<ChatGroupMemberItemResponse> findMembersByGroupIdWithProfile(
            Long groupId,
            String namePattern,
            int limit,
            int offset);

    @Query("""
            SELECT COUNT(cgm.id)
            FROM chat_group_members cgm
            LEFT JOIN users gp ON gp.id = cgm.member_id
            WHERE cgm.group_id = :groupId
              AND (:namePattern IS NULL OR LOWER(gp.full_name) LIKE LOWER(:namePattern))
            """)
    Mono<Long> countMembersByGroupIdWithNameFilter(Long groupId, String namePattern);

    @Query("SELECT COUNT(id) FROM chat_group_members WHERE group_id = :groupId")
    Mono<Long> countMembersByGroupId(Long groupId);

    @Modifying
    @Query("""
            INSERT INTO chat_group_members (group_id, member_id, role, joined_at)
            VALUES (:groupId, :memberId, 'MEMBER', CURRENT_TIMESTAMP)
            ON CONFLICT (group_id, member_id) DO NOTHING
            """)
    Mono<Void> insertMemberIfNotExists(Long groupId, Long memberId);
    
}


