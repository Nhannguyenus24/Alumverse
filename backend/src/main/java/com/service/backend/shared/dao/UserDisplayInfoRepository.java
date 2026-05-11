package com.service.backend.shared.dao;

import lombok.RequiredArgsConstructor;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collection;
import java.util.List;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class UserDisplayInfoRepository {

    private final DatabaseClient databaseClient;

    /**
     * Batch fetch display info (full_name + avatar_url) for the given user ids.
     * Returns an empty map if userIds is empty.
     */
    public Mono<Map<Integer, UserDisplayInfo>> findByUserIds(Collection<Integer> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return Mono.just(Map.of());
        }
        List<Integer> distinctIds = userIds.stream().distinct().toList();
        return databaseClient
                .sql("SELECT u.id AS user_id, u.avatar_url, gp.full_name " +
                        "FROM users u LEFT JOIN global_profiles gp ON u.id = gp.user_id " +
                        "WHERE u.id IN (:ids)")
                .bind("ids", distinctIds)
                .map((row, meta) -> UserDisplayInfo.builder()
                        .userId(row.get("user_id", Integer.class))
                        .fullName(row.get("full_name", String.class))
                        .avatarUrl(row.get("avatar_url", String.class))
                        .build())
                .all()
                .collectMap(UserDisplayInfo::getUserId, info -> info);
    }

    /**
     * Batch fetch display info for organization members (mapping member_id -> user display info).
     */
    public Mono<Map<Integer, UserDisplayInfo>> findByMemberIds(Collection<Integer> memberIds) {
        if (memberIds == null || memberIds.isEmpty()) {
            return Mono.just(Map.of());
        }
        List<Integer> distinctIds = memberIds.stream().distinct().toList();
        return databaseClient
                .sql("SELECT om.id AS member_id, u.avatar_url, gp.full_name " +
                        "FROM organization_members om " +
                        "JOIN users u ON om.user_id = u.id " +
                        "LEFT JOIN global_profiles gp ON u.id = gp.user_id " +
                        "WHERE om.id IN (:ids)")
                .bind("ids", distinctIds)
                .map((row, meta) -> {
                    Integer memberId = row.get("member_id", Integer.class);
                    UserDisplayInfo info = UserDisplayInfo.builder()
                            .userId(memberId) // We map memberId as the key in UserDisplayInfo for convenience in lookup
                            .fullName(row.get("full_name", String.class))
                            .avatarUrl(row.get("avatar_url", String.class))
                            .build();
                    return info;
                })
                .all()
                .collectMap(UserDisplayInfo::getUserId, info -> info);
    }

    public Mono<UserDisplayInfo> findByUserId(Integer userId) {
        if (userId == null) return Mono.empty();
        return findByUserIds(List.of(userId))
                .flatMap(map -> Mono.justOrEmpty(map.get(userId)));
    }

    /**
     * Convenience: collect all ids and return as flux of UserDisplayInfo.
     */
    public Flux<UserDisplayInfo> streamByUserIds(Collection<Integer> userIds) {
        return findByUserIds(userIds).flatMapMany(map -> Flux.fromIterable(map.values()));
    }
}
