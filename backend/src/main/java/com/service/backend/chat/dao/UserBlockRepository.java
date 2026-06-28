package com.service.backend.chat.dao;

import com.service.backend.chat.dto.BlockedMemberInGroupItemResponse;
import com.service.backend.chat.dto.BlockedMemberItemResponse;
import com.service.backend.shared.entity.UserBlock;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface UserBlockRepository extends ReactiveCrudRepository<UserBlock, Long> {

    @Query("""
            SELECT id, blocker_member_id, blocked_member_id, created_at
            FROM user_blocks
            WHERE blocker_member_id = :blockerMemberId
              AND blocked_member_id = :blockedMemberId
            LIMIT 1
            """)
    Mono<UserBlock> findByBlockerMemberIdAndBlockedMemberId(Long blockerMemberId, Long blockedMemberId);

    @Query("""
            SELECT COUNT(id)
            FROM user_blocks
            WHERE blocker_member_id = :blockerMemberId
              AND blocked_member_id = :blockedMemberId
            """)
    Mono<Long> countByBlockerMemberIdAndBlockedMemberId(Long blockerMemberId, Long blockedMemberId);

    @Query("""
            SELECT COUNT(id)
            FROM user_blocks
            WHERE (blocker_member_id = :memberAId AND blocked_member_id = :memberBId)
               OR (blocker_member_id = :memberBId AND blocked_member_id = :memberAId)
            """)
    Mono<Long> countAnyBlockBetweenMembers(Long memberAId, Long memberBId);

    @Query("""
            SELECT COUNT(ub.id)
            FROM user_blocks ub
            INNER JOIN chat_group_members cgm ON cgm.member_id = ub.blocked_member_id
            WHERE ub.blocker_member_id = :senderMemberId
              AND cgm.group_id = :groupId
            """)
    Mono<Long> countSenderBlockedMembersInGroup(Long senderMemberId, Long groupId);

    @Query("""
            SELECT COUNT(ub.id)
            FROM user_blocks ub
            INNER JOIN chat_group_members cgm ON cgm.member_id = ub.blocker_member_id
            WHERE ub.blocked_member_id = :senderMemberId
              AND cgm.group_id = :groupId
            """)
    Mono<Long> countSenderBlockedByMembersInGroup(Long senderMemberId, Long groupId);

    @Query("""
            SELECT ub.blocked_member_id AS member_id,
                   gp.full_name AS full_name
            FROM user_blocks ub
            INNER JOIN chat_group_members cgm
                ON cgm.member_id = ub.blocked_member_id
               AND cgm.group_id = :groupId
            LEFT JOIN users gp ON gp.id = ub.blocked_member_id
            WHERE ub.blocker_member_id = :blockerMemberId
            ORDER BY ub.created_at DESC
            """)
    Flux<BlockedMemberInGroupItemResponse> findBlockedMembersInGroupByBlocker(Long blockerMemberId, Long groupId);

    @Modifying
    @Query("""
            DELETE FROM user_blocks
            WHERE blocker_member_id = :blockerMemberId
              AND blocked_member_id = :blockedMemberId
            """)
    Mono<Integer> deleteByBlockerMemberIdAndBlockedMemberId(Long blockerMemberId, Long blockedMemberId);

    String BLOCKED_SEARCH_FROM_JOIN = """
            FROM user_blocks ub
            INNER JOIN users u ON u.id = ub.blocked_member_id
            """;

    String BLOCKED_SEARCH_WHERE = """
            WHERE ub.blocker_member_id = :blockerMemberId
              AND (:fullName IS NULL OR LOWER(u.full_name) LIKE LOWER(:fullName))
            """;

    @Query("""
            SELECT ub.blocked_member_id AS blocked_member_id,
                   u.full_name AS full_name,
                   u.avatar_url AS avatar_url,
                   ub.created_at AS blocked_at
            """ + BLOCKED_SEARCH_FROM_JOIN + BLOCKED_SEARCH_WHERE + """
            ORDER BY ub.created_at DESC
            LIMIT :limit OFFSET :offset
            """)
    Flux<BlockedMemberItemResponse> searchBlockedMembersByBlockerMemberId(
            Long blockerMemberId,
            String fullName,
            int limit,
            int offset);

    @Query("SELECT COUNT(ub.id) " + BLOCKED_SEARCH_FROM_JOIN + BLOCKED_SEARCH_WHERE)
    Mono<Long> countBlockedMembersByBlockerMemberId(Long blockerMemberId, String fullName);
}
