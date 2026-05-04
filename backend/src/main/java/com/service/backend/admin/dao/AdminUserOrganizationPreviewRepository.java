package com.service.backend.admin.dao;

import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.stereotype.Repository;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

/**
 * Batch-load each user's primary organization (lowest organization_members.id).
 */
@Repository
@RequiredArgsConstructor
public class AdminUserOrganizationPreviewRepository {

    private final DatabaseClient databaseClient;

    public record PrimaryOrg(Integer userId, Integer organizationId, String organizationName) {}

    public Mono<Map<Integer, PrimaryOrg>> findPrimaryOrgByUserIds(Collection<Integer> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return Mono.just(Map.of());
        }
        List<Integer> ids = userIds.stream().distinct().toList();
        return databaseClient
                .sql("""
                        SELECT om.user_id, om.organization_id, o.name AS organization_name
                        FROM organization_members om
                        LEFT JOIN organizations o ON o.id = om.organization_id
                        WHERE om.user_id IN (:ids)
                        ORDER BY om.user_id ASC, om.id ASC
                        """)
                .bind("ids", ids)
                .map((row, meta) -> new PrimaryOrg(
                        row.get("user_id", Integer.class),
                        row.get("organization_id", Integer.class),
                        row.get("organization_name", String.class)))
                .all()
                .collectList()
                .map(rows -> {
                    Map<Integer, PrimaryOrg> map = new LinkedHashMap<>();
                    for (PrimaryOrg row : rows) {
                        map.putIfAbsent(row.userId(), row);
                    }
                    return map;
                });
    }
}
