package com.service.backend.chat.dao;

import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;

import com.service.backend.shared.entity.OrganizationMember;
import com.service.backend.chat.dto.NetworkMemberSearchItemResponse;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Network directory search. Custom SELECT returns {@link NetworkMemberSearchItemResponse}
 * (class DTO), not interface projection — see docs/backend/network-member-search-r2dbc-mapping.md.
 */
@Repository
public interface NetworkMemberSearchRepository
        extends ReactiveCrudRepository<OrganizationMember, Integer> {

    String SEARCH_FROM_JOIN = """
            FROM organization_members om
            INNER JOIN users u ON u.id = om.user_id
            LEFT JOIN global_profiles gp ON gp.user_id = u.id
            """;

    String SEARCH_WHERE = """
            WHERE om.organization_id = :organizationId
              AND om.status = 'ACTIVE'
              AND u.id <> :currentUserId
              AND (:fullName IS NULL OR LOWER(gp.full_name) LIKE LOWER(:fullName))
              AND (:programJson IS NULL OR om.program @> CAST(:programJson AS jsonb))
              AND (:majorJson IS NULL OR om.major @> CAST(:majorJson AS jsonb))
            """;

    @Query("""
            SELECT om.user_id AS user_id,
                   gp.full_name AS full_name,
                   om.program AS program,
                   om.major AS major,
                   u.avatar_url AS avatar_url
            """ + SEARCH_FROM_JOIN + SEARCH_WHERE + """
            ORDER BY gp.full_name ASC, om.id ASC
            LIMIT :limit OFFSET :offset
            """)
    Flux<NetworkMemberSearchItemResponse> searchMembers(
            Integer organizationId,
            Long currentUserId,
            String fullName,
            String programJson,
            String majorJson,
            int limit,
            int offset);

    @Query("""
            SELECT COUNT(om.id)
            """ + SEARCH_FROM_JOIN + SEARCH_WHERE)
    Mono<Long> countSearchMembers(
            Integer organizationId,
            Long currentUserId,
            String fullName,
            String programJson,
            String majorJson);
}
