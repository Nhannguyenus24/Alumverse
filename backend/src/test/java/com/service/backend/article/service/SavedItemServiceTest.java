package com.service.backend.article.service;

import com.service.backend.article.dao.SavedItemR2dbcRepository;
import com.service.backend.article.dto.SaveItemRequest;
import com.service.backend.shared.entity.SavedItem;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.context.Context;

import java.time.LocalDateTime;
import java.util.Collections;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("SavedItemService Unit Tests")
class SavedItemServiceTest {

    @Mock private SavedItemR2dbcRepository savedItemRepository;

    @InjectMocks
    private SavedItemService savedItemService;

    private Context withUser(String userId) {
        return ReactiveSecurityContextHolder.withAuthentication(
                new UsernamePasswordAuthenticationToken(userId, "pass", Collections.emptyList())
        );
    }

    // ─── saveItem ────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("saveItem()")
    class SaveItem {

        @Test
        @DisplayName("should fail when item is already saved")
        void saveItem_alreadySaved() {
            SaveItemRequest request = new SaveItemRequest();
            request.setItemType("JOB");
            request.setItemId(1);

            when(savedItemRepository.existsByMemberIdAndItemTypeAndItemId(1, "JOB", 1))
                    .thenReturn(Mono.just(true));

            StepVerifier.create(savedItemService.saveItem(request).contextWrite(withUser("1")))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.ITEM_ALREADY_SAVED)
                    .verify();
        }

        @Test
        @DisplayName("should save item successfully")
        void saveItem_success() {
            SaveItemRequest request = new SaveItemRequest();
            request.setItemType("JOB");
            request.setItemId(1);

            SavedItem saved = SavedItem.builder()
                    .id(1)
                    .memberId(1)
                    .itemType("JOB")
                    .itemId(1)
                    .savedAt(LocalDateTime.now())
                    .build();

            when(savedItemRepository.existsByMemberIdAndItemTypeAndItemId(1, "JOB", 1))
                    .thenReturn(Mono.just(false));
            when(savedItemRepository.save(any())).thenReturn(Mono.just(saved));

            StepVerifier.create(savedItemService.saveItem(request).contextWrite(withUser("1")))
                    .assertNext(res -> assertThat(res.getId()).isEqualTo(1))
                    .verifyComplete();
        }
    }

    // ─── unsaveItem ───────────────────────────────────────────────────────────

    @Nested
    @DisplayName("unsaveItem()")
    class UnsaveItem {

        @Test
        @DisplayName("should unsave item successfully")
        void unsaveItem_success() {
            when(savedItemRepository.existsByMemberIdAndItemTypeAndItemId(1, "JOB", 1))
                    .thenReturn(Mono.just(true));
            when(savedItemRepository.deleteByMemberIdAndItemTypeAndItemId(1, "JOB", 1))
                    .thenReturn(Mono.empty());

            StepVerifier.create(savedItemService.unsaveItem("JOB", 1).contextWrite(withUser("1")))
                    .assertNext(res -> assertThat(res).isTrue())
                    .verifyComplete();
        }

        @Test
        @DisplayName("should complete with error if item not saved")
        void unsaveItem_notFound() {
            when(savedItemRepository.existsByMemberIdAndItemTypeAndItemId(1, "JOB", 1))
                    .thenReturn(Mono.just(false));

            StepVerifier.create(savedItemService.unsaveItem("JOB", 1).contextWrite(withUser("1")))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.SAVED_ITEM_NOT_FOUND)
                    .verify();
        }
    }

    // ─── checkSaved ───────────────────────────────────────────────────────────

    @Nested
    @DisplayName("checkSaved()")
    class CheckSaved {

        @Test
        @DisplayName("should return true when item is saved")
        void checkSaved_isSaved() {
            when(savedItemRepository.existsByMemberIdAndItemTypeAndItemId(1, "JOB", 1))
                    .thenReturn(Mono.just(true));

            StepVerifier.create(savedItemService.checkSaved("JOB", 1).contextWrite(withUser("1")))
                    .assertNext(res -> assertThat(res.getIsSaved()).isTrue())
                    .verifyComplete();
        }

        @Test
        @DisplayName("should return false when item is not saved")
        void checkSaved_isNotSaved() {
            when(savedItemRepository.existsByMemberIdAndItemTypeAndItemId(1, "JOB", 1))
                    .thenReturn(Mono.just(false));

            StepVerifier.create(savedItemService.checkSaved("JOB", 1).contextWrite(withUser("1")))
                    .assertNext(res -> assertThat(res.getIsSaved()).isFalse())
                    .verifyComplete();
        }
    }
}
