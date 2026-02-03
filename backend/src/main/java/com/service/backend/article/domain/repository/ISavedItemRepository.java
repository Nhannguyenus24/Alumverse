package com.service.backend.article.domain.repository;

import com.service.backend.article.domain.entity.SavedItem;
import com.service.backend.article.presentation.dto.response.PaginatedResponse;
import reactor.core.publisher.Mono;

public interface ISavedItemRepository {

    Mono<SavedItem> save(SavedItem savedItem);

    Mono<Boolean> unsave(Integer memberId, String itemType, Integer itemId);

    Mono<Boolean> isSaved(Integer memberId, String itemType, Integer itemId);

    Mono<PaginatedResponse<SavedItem>> findByMemberId(Integer memberId, int page, int limit);

    Mono<PaginatedResponse<SavedItem>> findByMemberIdAndItemType(Integer memberId, String itemType, int page, int limit);
}
