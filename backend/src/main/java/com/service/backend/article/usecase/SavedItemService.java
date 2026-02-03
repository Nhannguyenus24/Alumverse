package com.service.backend.article.usecase;

import com.service.backend.article.domain.entity.SavedItem;
import com.service.backend.article.domain.repository.ISavedItemRepository;
import com.service.backend.article.presentation.dto.request.SaveItemRequest;
import com.service.backend.article.presentation.dto.response.PaginatedResponse;
import com.service.backend.article.presentation.dto.response.SavedCheckResponse;
import com.service.backend.article.presentation.dto.response.SavedItemResponse;
import com.service.backend.shared.constants.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class SavedItemService {

    private final ISavedItemRepository savedItemRepository;

    private static final Integer MOCK_MEMBER_ID = 1;

    public Mono<SavedItemResponse> saveItem(SaveItemRequest request) {
        return savedItemRepository.isSaved(MOCK_MEMBER_ID, request.getItemType(), request.getItemId())
                .flatMap(isSaved -> {
                    if (isSaved) {
                        return Mono.error(new ApplicationException(ErrorCode.ITEM_ALREADY_SAVED, "Item already saved"));
                    }

                    SavedItem savedItem = SavedItem.builder()
                            .memberId(MOCK_MEMBER_ID)
                            .itemType(request.getItemType())
                            .itemId(request.getItemId())
                            .note(request.getNote())
                            .build();

                    return savedItemRepository.save(savedItem)
                            .map(SavedItemResponse::from);
                });
    }

    public Mono<Boolean> unsaveItem(String itemType, Integer itemId) {
        return savedItemRepository.isSaved(MOCK_MEMBER_ID, itemType, itemId)
                .flatMap(isSaved -> {
                    if (!isSaved) {
                        return Mono.error(new ApplicationException(ErrorCode.SAVED_ITEM_NOT_FOUND, "Saved item not found"));
                    }
                    return savedItemRepository.unsave(MOCK_MEMBER_ID, itemType, itemId);
                });
    }

    public Mono<SavedCheckResponse> checkSaved(String itemType, Integer itemId) {
        return savedItemRepository.isSaved(MOCK_MEMBER_ID, itemType, itemId)
                .map(isSaved -> SavedCheckResponse.builder().isSaved(isSaved).build());
    }

    public Mono<PaginatedResponse<SavedItemResponse>> getMySavedItems(int page, int limit) {
        return savedItemRepository.findByMemberId(MOCK_MEMBER_ID, page, limit)
                .map(paginatedResponse -> PaginatedResponse.of(
                        paginatedResponse.getItems().stream().map(SavedItemResponse::from).toList(),
                        paginatedResponse.getTotal(),
                        paginatedResponse.getPage(),
                        paginatedResponse.getLimit()
                ));
    }

    public Mono<PaginatedResponse<SavedItemResponse>> getMySavedItemsByType(String itemType, int page, int limit) {
        return savedItemRepository.findByMemberIdAndItemType(MOCK_MEMBER_ID, itemType, page, limit)
                .map(paginatedResponse -> PaginatedResponse.of(
                        paginatedResponse.getItems().stream().map(SavedItemResponse::from).toList(),
                        paginatedResponse.getTotal(),
                        paginatedResponse.getPage(),
                        paginatedResponse.getLimit()
                ));
    }
}
