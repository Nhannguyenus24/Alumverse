package com.service.backend.article.usecase;

import com.service.backend.article.dao.SavedItemR2dbcRepository;
import com.service.backend.article.entity.SavedItem;
import com.service.backend.article.dto.SaveItemRequest;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.article.dto.SavedCheckResponse;
import com.service.backend.article.dto.SavedItemResponse;
import com.service.backend.shared.constants.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class SavedItemService {

    private final SavedItemR2dbcRepository savedItemRepository;

    private static final Integer MOCK_MEMBER_ID = 1;

    public Mono<SavedItemResponse> saveItem(SaveItemRequest request) {
        return savedItemRepository.existsByMemberIdAndItemTypeAndItemId(MOCK_MEMBER_ID, request.getItemType(), request.getItemId())
                .flatMap(isSaved -> {
                    if (isSaved) {
                        return Mono.error(new ApplicationException(ErrorCode.ITEM_ALREADY_SAVED, "Item already saved"));
                    }

                    SavedItem savedItem = SavedItem.builder()
                            .memberId(MOCK_MEMBER_ID)
                            .itemType(request.getItemType())
                            .itemId(request.getItemId())
                            .note(request.getNote())
                            .savedAt(LocalDateTime.now())
                            .build();

                    return savedItemRepository.save(savedItem)
                            .map(SavedItemResponse::from);
                });
    }

    public Mono<Boolean> unsaveItem(String itemType, Integer itemId) {
        return savedItemRepository.existsByMemberIdAndItemTypeAndItemId(MOCK_MEMBER_ID, itemType, itemId)
                .flatMap(isSaved -> {
                    if (!isSaved) {
                        return Mono.error(new ApplicationException(ErrorCode.SAVED_ITEM_NOT_FOUND, "Saved item not found"));
                    }
                    return savedItemRepository.deleteByMemberIdAndItemTypeAndItemId(MOCK_MEMBER_ID, itemType, itemId)
                            .thenReturn(true);
                });
    }

    public Mono<SavedCheckResponse> checkSaved(String itemType, Integer itemId) {
        return savedItemRepository.existsByMemberIdAndItemTypeAndItemId(MOCK_MEMBER_ID, itemType, itemId)
                .map(isSaved -> SavedCheckResponse.builder().isSaved(isSaved).build());
    }

    public Mono<PaginatedResponse<SavedItemResponse>> getMySavedItems(int page, int limit) {
        int offset = page * limit;
        return savedItemRepository.findByMemberIdWithPagination(MOCK_MEMBER_ID, limit, offset)
                .collectList()
                .zipWith(savedItemRepository.countByMemberId(MOCK_MEMBER_ID))
                .map(tuple -> PaginatedResponse.of(
                        tuple.getT1().stream().map(SavedItemResponse::from).toList(),
                        tuple.getT2(), page, limit
                ));
    }

    public Mono<PaginatedResponse<SavedItemResponse>> getMySavedItemsByType(String itemType, int page, int limit) {
        int offset = page * limit;
        return savedItemRepository.findByMemberIdAndItemType(MOCK_MEMBER_ID, itemType, limit, offset)
                .collectList()
                .zipWith(savedItemRepository.countByMemberIdAndItemType(MOCK_MEMBER_ID, itemType))
                .map(tuple -> PaginatedResponse.of(
                        tuple.getT1().stream().map(SavedItemResponse::from).toList(),
                        tuple.getT2(), page, limit
                ));
    }
}
