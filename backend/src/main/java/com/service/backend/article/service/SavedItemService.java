package com.service.backend.article.usecase;

import com.service.backend.article.dao.SavedItemR2dbcRepository;
import com.service.backend.shared.entity.SavedItem;
import com.service.backend.article.dto.SaveItemRequest;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.article.dto.SavedCheckResponse;
import com.service.backend.article.dto.SavedItemResponse;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class SavedItemService {

    private final SavedItemR2dbcRepository savedItemRepository;

    public Mono<SavedItemResponse> saveItem(SaveItemRequest request) {
        return SecurityUtils.getCurrentUserId().flatMap(userId -> {
            Integer memberId = userId.intValue();
            return savedItemRepository.existsByMemberIdAndItemTypeAndItemId(memberId, request.getItemType(), request.getItemId())
                    .flatMap(isSaved -> {
                        if (isSaved) {
                            return Mono.error(new ApplicationException(ErrorCode.ITEM_ALREADY_SAVED, "Item already saved"));
                        }

                        SavedItem savedItem = SavedItem.builder()
                                .memberId(memberId)
                                .itemType(request.getItemType())
                                .itemId(request.getItemId())
                                .note(request.getNote())
                                .savedAt(LocalDateTime.now())
                                .build();

                        return savedItemRepository.save(savedItem).map(SavedItemResponse::from);
                    });
        });
    }

    public Mono<Boolean> unsaveItem(String itemType, Integer itemId) {
        return SecurityUtils.getCurrentUserId().flatMap(userId -> {
            Integer memberId = userId.intValue();
            return savedItemRepository.existsByMemberIdAndItemTypeAndItemId(memberId, itemType, itemId)
                    .flatMap(isSaved -> {
                        if (!isSaved) {
                            return Mono.error(new ApplicationException(ErrorCode.SAVED_ITEM_NOT_FOUND, "Saved item not found"));
                        }
                        return savedItemRepository.deleteByMemberIdAndItemTypeAndItemId(memberId, itemType, itemId)
                                .thenReturn(true);
                    });
        });
    }

    public Mono<SavedCheckResponse> checkSaved(String itemType, Integer itemId) {
        return SecurityUtils.getCurrentUserId().flatMap(userId ->
                savedItemRepository.existsByMemberIdAndItemTypeAndItemId(userId.intValue(), itemType, itemId)
                        .map(isSaved -> SavedCheckResponse.builder().isSaved(isSaved).build()));
    }

    public Mono<PaginatedResponse<SavedItemResponse>> getMySavedItems(int page, int limit) {
        int offset = page * limit;
        return SecurityUtils.getCurrentUserId().flatMap(userId -> {
            Integer memberId = userId.intValue();
            return savedItemRepository.findByMemberIdWithPagination(memberId, limit, offset)
                    .collectList()
                    .zipWith(savedItemRepository.countByMemberId(memberId))
                    .map(tuple -> PaginatedResponse.of(
                            tuple.getT1().stream().map(SavedItemResponse::from).toList(),
                            tuple.getT2(), page, limit
                    ));
        });
    }

    public Mono<PaginatedResponse<SavedItemResponse>> getMySavedItemsByType(String itemType, int page, int limit) {
        int offset = page * limit;
        return SecurityUtils.getCurrentUserId().flatMap(userId -> {
            Integer memberId = userId.intValue();
            return savedItemRepository.findByMemberIdAndItemType(memberId, itemType, limit, offset)
                    .collectList()
                    .zipWith(savedItemRepository.countByMemberIdAndItemType(memberId, itemType))
                    .map(tuple -> PaginatedResponse.of(
                            tuple.getT1().stream().map(SavedItemResponse::from).toList(),
                            tuple.getT2(), page, limit
                    ));
        });
    }
}
