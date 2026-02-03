package com.service.backend.article.dao;

import com.service.backend.article.domain.entity.SavedItem;
import com.service.backend.article.domain.repository.ISavedItemRepository;
import com.service.backend.article.presentation.dto.response.PaginatedResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Repository
@RequiredArgsConstructor
public class SavedItemRepository implements ISavedItemRepository {

    private final SavedItemR2dbcRepository savedItemRepo;

    @Override
    public Mono<SavedItem> save(SavedItem savedItem) {
        savedItem.setSavedAt(LocalDateTime.now());
        return savedItemRepo.save(savedItem);
    }

    @Override
    public Mono<Boolean> unsave(Integer memberId, String itemType, Integer itemId) {
        return savedItemRepo.deleteByMemberIdAndItemTypeAndItemId(memberId, itemType, itemId)
                .thenReturn(true);
    }

    @Override
    public Mono<Boolean> isSaved(Integer memberId, String itemType, Integer itemId) {
        return savedItemRepo.existsByMemberIdAndItemTypeAndItemId(memberId, itemType, itemId);
    }

    @Override
    public Mono<PaginatedResponse<SavedItem>> findByMemberId(Integer memberId, int page, int limit) {
        int offset = page * limit;
        return savedItemRepo.findByMemberIdWithPagination(memberId, limit, offset)
                .collectList()
                .zipWith(savedItemRepo.countByMemberId(memberId))
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit));
    }

    @Override
    public Mono<PaginatedResponse<SavedItem>> findByMemberIdAndItemType(Integer memberId, String itemType, int page, int limit) {
        int offset = page * limit;
        return savedItemRepo.findByMemberIdAndItemType(memberId, itemType, limit, offset)
                .collectList()
                .zipWith(savedItemRepo.countByMemberIdAndItemType(memberId, itemType))
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit));
    }
}
