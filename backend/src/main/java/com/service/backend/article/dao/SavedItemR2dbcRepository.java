package com.service.backend.article.dao;

import com.service.backend.shared.entity.SavedItem;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface SavedItemR2dbcRepository extends ReactiveCrudRepository<SavedItem, Integer> {

    @Query("SELECT * FROM saved_items WHERE member_id = :memberId ORDER BY saved_at DESC LIMIT :limit OFFSET :offset")
    Flux<SavedItem> findByMemberIdWithPagination(Integer memberId, int limit, int offset);

    @Query("SELECT COUNT(*) FROM saved_items WHERE member_id = :memberId")
    Mono<Long> countByMemberId(Integer memberId);

    @Query("SELECT * FROM saved_items WHERE member_id = :memberId AND item_type = :itemType ORDER BY saved_at DESC LIMIT :limit OFFSET :offset")
    Flux<SavedItem> findByMemberIdAndItemType(Integer memberId, String itemType, int limit, int offset);

    @Query("SELECT COUNT(*) FROM saved_items WHERE member_id = :memberId AND item_type = :itemType")
    Mono<Long> countByMemberIdAndItemType(Integer memberId, String itemType);

    Mono<Boolean> existsByMemberIdAndItemTypeAndItemId(Integer memberId, String itemType, Integer itemId);

    Mono<Void> deleteByMemberIdAndItemTypeAndItemId(Integer memberId, String itemType, Integer itemId);
}
