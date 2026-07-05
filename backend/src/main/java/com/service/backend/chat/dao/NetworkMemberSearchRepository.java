package com.service.backend.chat.dao;

import java.util.List;

import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;

import com.service.backend.shared.entity.OrganizationMember;
import com.service.backend.chat.dto.NetworkMemberSearchItemResponse;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Network directory search. Custom SELECT returns {@link NetworkMemberSearchItemResponse}
 */
@Repository
public interface NetworkMemberSearchRepository
        extends ReactiveCrudRepository<OrganizationMember, Integer> {

    String SEARCH_FROM_JOIN = """
            FROM organization_members om
            INNER JOIN users u ON u.id = om.user_id
            """;

    String SEARCH_WHERE = """
            WHERE (:filterByOrg = FALSE OR om.organization_id IN (:organizationIds))
              AND om.status = 'ACTIVE'
              AND u.id <> :currentUserId
              AND NOT EXISTS (
                SELECT 1 FROM user_blocks ub
                WHERE (ub.blocker_member_id = :currentUserId AND ub.blocked_member_id = u.id)
                   OR (ub.blocker_member_id = u.id AND ub.blocked_member_id = :currentUserId)
              )
              AND (:fullName IS NULL OR LOWER(u.full_name) LIKE LOWER(:fullName))
              AND (:program IS NULL OR EXISTS (
                    SELECT 1 FROM jsonb_array_elements_text(om.program) AS elem(val)
                    WHERE val ILIKE :program))
              AND (:major IS NULL OR EXISTS (
                    SELECT 1 FROM jsonb_array_elements_text(om.major) AS elem(val)
                    WHERE val ILIKE :major))
            """;

    // DISTINCT ON (om.user_id) collapses multi-organization members to a single
    // row (a user may belong to >1 organization); the inner ORDER BY must lead
    // with om.user_id, so the outer query re-sorts alphabetically for display.
    @Query("""
            SELECT * FROM (
                SELECT DISTINCT ON (om.user_id)
                       om.user_id AS user_id,
                       u.full_name AS full_name,
                       CAST(om.program AS text) AS program,
                       CAST(om.major AS text) AS major,
                       u.avatar_url AS avatar_url
            """ + SEARCH_FROM_JOIN + SEARCH_WHERE + """
                ORDER BY om.user_id, om.id ASC
            ) sub
            ORDER BY sub.full_name ASC, sub.user_id ASC
            LIMIT :limit OFFSET :offset
            """)
    Flux<NetworkMemberSearchItemResponse> searchMembers(
            boolean filterByOrg,
            List<Integer> organizationIds,
            Long currentUserId,
            String fullName,
            String program,
            String major,
            int limit,
            int offset);

    @Query("""
            SELECT COUNT(DISTINCT om.user_id)
            """ + SEARCH_FROM_JOIN + SEARCH_WHERE)
    Mono<Long> countSearchMembers(
            boolean filterByOrg,
            List<Integer> organizationIds,
            Long currentUserId,
            String fullName,
            String program,
            String major);
}
