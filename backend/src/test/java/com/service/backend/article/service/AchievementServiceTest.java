package com.service.backend.article.service;

import com.service.backend.article.dao.AchievementR2dbcRepository;
import com.service.backend.article.dto.CreateAchievementRequest;
import com.service.backend.article.dto.UpdateAchievementRequest;
import com.service.backend.shared.entity.Achievement;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.enums.Status;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.service.ImageService;
import com.service.backend.shared.utils.CacheUtils;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AchievementService Unit Tests")
class AchievementServiceTest {

    @Mock private AchievementR2dbcRepository achievementRepository;
    @Mock private ImageService imageService;
    @Mock private CacheUtils cacheUtils;

    @InjectMocks
    private AchievementService achievementService;

    // ─── getById ─────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("getById()")
    class GetById {

        @Test
        @DisplayName("should return achievement when found")
        void getById_success() {
            Achievement achievement = Achievement.builder()
                    .id(1)
                    .title("Best Alumnus")
                    .description("Outstanding contribution")
                    .status(Status.APPROVED)
                    .awardedDate(LocalDate.of(2024, 1, 1))
                    .build();

            when(achievementRepository.findById(1)).thenReturn(Mono.just(achievement));

            StepVerifier.create(achievementService.getById(1))
                    .assertNext(dto -> {
                        assertThat(dto.getTitle()).isEqualTo("Best Alumnus");
                        assertThat(dto.getStatus()).isEqualTo(Status.APPROVED);
                    })
                    .verifyComplete();
        }

        @Test
        @DisplayName("should fail when achievement not found")
        void getById_notFound() {
            when(achievementRepository.findById(99)).thenReturn(Mono.empty());

            StepVerifier.create(achievementService.getById(99))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.ACHIEVEMENT_NOT_FOUND)
                    .verify();
        }
    }

    // ─── delete ──────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("delete()")
    class Delete {

        @Test
        @DisplayName("should delete achievement successfully")
        void delete_success() {
            Achievement achievement = Achievement.builder()
                    .id(1)
                    .title("Best Alumnus")
                    .build();

            when(achievementRepository.findById(1)).thenReturn(Mono.just(achievement));
            when(achievementRepository.deleteById(1)).thenReturn(Mono.empty());
            when(cacheUtils.clear(anyString())).thenReturn(Mono.empty());

            StepVerifier.create(achievementService.delete(1))
                    .assertNext(result -> assertThat(result).isTrue())
                    .verifyComplete();
        }

        @Test
        @DisplayName("should fail when achievement not found")
        void delete_notFound() {
            when(achievementRepository.findById(99)).thenReturn(Mono.empty());

            StepVerifier.create(achievementService.delete(99))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.ACHIEVEMENT_NOT_FOUND)
                    .verify();
        }
    }

    // ─── update ──────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("update()")
    class Update {

        @Test
        @DisplayName("should update achievement successfully")
        void update_success() {
            Achievement existing = Achievement.builder()
                    .id(1)
                    .title("Old Title")
                    .description("Old Desc")
                    .build();

            Achievement updated = Achievement.builder()
                    .id(1)
                    .title("New Title")
                    .description("New Desc")
                    .build();

            UpdateAchievementRequest request = new UpdateAchievementRequest();
            request.setTitle("New Title");
            request.setDescription("New Desc");

            when(achievementRepository.findById(1)).thenReturn(Mono.just(existing));
            when(imageService.uploadBase64IfPresent(any())).thenReturn(Mono.empty());
            when(achievementRepository.save(any())).thenReturn(Mono.just(updated));
            when(cacheUtils.clear(anyString())).thenReturn(Mono.empty());

            StepVerifier.create(achievementService.update(1, request))
                    .assertNext(dto -> assertThat(dto.getTitle()).isEqualTo("New Title"))
                    .verifyComplete();
        }

        @Test
        @DisplayName("should fail when achievement not found")
        void update_notFound() {
            UpdateAchievementRequest request = new UpdateAchievementRequest();
            request.setTitle("New Title");

            when(achievementRepository.findById(99)).thenReturn(Mono.empty());

            StepVerifier.create(achievementService.update(99, request))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.ACHIEVEMENT_NOT_FOUND)
                    .verify();
        }
    }
}
