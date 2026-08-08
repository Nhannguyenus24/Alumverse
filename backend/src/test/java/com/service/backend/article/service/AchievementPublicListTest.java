package com.service.backend.article.service;

import com.service.backend.article.dao.AchievementR2dbcRepository;
import com.service.backend.article.dto.AchievementDetailDTO;
import com.service.backend.article.dto.AchievementResponse;
import com.service.backend.shared.dto.FeaturedPaginatedResponse;
import com.service.backend.shared.service.ImageService;
import com.service.backend.shared.utils.CacheUtils;
import com.service.backend.user.service.NotificationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.LocalDate;
import java.util.function.Supplier;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("AchievementService.getPublicList()")
class AchievementPublicListTest {

    @Mock private AchievementR2dbcRepository achievementRepository;
    @Mock private ImageService imageService;
    @Mock private CacheUtils cacheUtils;
    @Mock private NotificationService notificationService;

    @InjectMocks
    private AchievementService achievementService;

    @SuppressWarnings("unchecked")
    private void passThroughCache() {
        when(cacheUtils.<FeaturedPaginatedResponse<AchievementResponse>>getOrCompute(
                eq("achievement_cache"), anyString(), any(), any()))
                .thenAnswer(invocation -> ((Supplier<Mono<FeaturedPaginatedResponse<AchievementResponse>>>)
                        invocation.getArgument(3)).get());
    }

    private static AchievementDetailDTO detail(Integer id, String title, String description) {
        return AchievementDetailDTO.builder()
                .id(id)
                .title(title)
                .description(description)
                .build();
    }

    @Test
    @DisplayName("normalizes filters, excludes featured from the page, and reports the server total")
    void filtersAndPaginates() {
        passThroughCache();
        when(achievementRepository.findPublicFeatured(
                2, "award", "competition_award,student_honor", "2026-07-01", "2026-08-07", "updated", "newest"))
                .thenReturn(Mono.just(detail(8, "Featured", "<p>Featured body</p>")));
        when(achievementRepository.findPublicPage(
                2, 8, "award", "competition_award,student_honor", "2026-07-01", "2026-08-07", "updated", "newest", 12, 0))
                .thenReturn(Flux.just(detail(6, "Result", "<p>Result body</p>")));
        when(achievementRepository.countPublicPage(
                2, 8, "award", "competition_award,student_honor", "2026-07-01", "2026-08-07"))
                .thenReturn(Mono.just(25L));

        StepVerifier.create(achievementService.getPublicList(
                        0, 12, 2, "  award  ", "student_honor,competition_award",
                        LocalDate.of(2026, 7, 1), LocalDate.of(2026, 8, 7), null, "newest"))
                .assertNext(response -> {
                    assertThat(response.getFeatured().getId()).isEqualTo(8);
                    assertThat(response.getItems()).extracting(AchievementResponse::getId).containsExactly(6);
                    assertThat(response.getTotalItem()).isEqualTo(25);
                    assertThat(response.getTotalPage()).isEqualTo(3);
                    assertThat(response.getHasNext()).isTrue();
                    assertThat(response.getHasPrevious()).isFalse();
                })
                .verifyComplete();
    }

    @Test
    @DisplayName("strips HTML and bounds description length on both featured and items")
    void trimsDescriptions() {
        passThroughCache();
        String longBody = "<p>" + "x".repeat(400) + "</p>";
        when(achievementRepository.findPublicFeatured(2, "", "", "", "", "updated", "newest"))
                .thenReturn(Mono.just(detail(1, "Featured", longBody)));
        when(achievementRepository.findPublicPage(2, 1, "", "", "", "", "updated", "newest", 12, 0))
                .thenReturn(Flux.just(detail(2, "Item", "<p><b>Bold</b> body</p>")));
        when(achievementRepository.countPublicPage(2, 1, "", "", "", ""))
                .thenReturn(Mono.just(1L));

        StepVerifier.create(achievementService.getPublicList(
                        0, 12, 2, null, null, null, null, null, null))
                .assertNext(response -> {
                    assertThat(response.getFeatured().getDescription()).hasSize(260).doesNotContain("<p>");
                    assertThat(response.getItems().get(0).getDescription()).isEqualTo("Bold body");
                })
                .verifyComplete();
    }

    @Test
    @DisplayName("passes null featuredId through when the filtered set is empty")
    void emptyFeatured() {
        passThroughCache();
        when(achievementRepository.findPublicFeatured(2, "", "", "", "", "updated", "oldest"))
                .thenReturn(Mono.empty());
        when(achievementRepository.findPublicPage(2, null, "", "", "", "", "updated", "oldest", 12, 0))
                .thenReturn(Flux.empty());
        when(achievementRepository.countPublicPage(2, null, "", "", "", ""))
                .thenReturn(Mono.just(0L));

        StepVerifier.create(achievementService.getPublicList(
                        0, 12, 2, null, null, null, null, null, "oldest"))
                .assertNext(response -> {
                    assertThat(response.getFeatured()).isNull();
                    assertThat(response.getItems()).isEmpty();
                    assertThat(response.getTotalPage()).isZero();
                })
                .verifyComplete();
    }

    @Test
    @DisplayName("passes sortBy=awarded through so the home page keeps its awarded_date order")
    void honoursAwardedSort() {
        passThroughCache();
        when(achievementRepository.findPublicFeatured(2, "", "", "", "", "awarded", "newest"))
                .thenReturn(Mono.just(detail(9, "Newest award", "body")));
        when(achievementRepository.findPublicPage(2, 9, "", "", "", "", "awarded", "newest", 6, 0))
                .thenReturn(Flux.just(detail(4, "Older award", "body")));
        when(achievementRepository.countPublicPage(2, 9, "", "", "", ""))
                .thenReturn(Mono.just(1L));

        StepVerifier.create(achievementService.getPublicList(
                        0, 6, 2, null, null, null, null, "awarded", null))
                .assertNext(response -> assertThat(response.getFeatured().getId()).isEqualTo(9))
                .verifyComplete();
    }

    @Test
    @DisplayName("falls back to sortBy=updated for null and unrecognized values")
    void unknownSortByFallsBackToUpdated() {
        passThroughCache();
        when(achievementRepository.findPublicFeatured(2, "", "", "", "", "updated", "newest"))
                .thenReturn(Mono.empty());
        when(achievementRepository.findPublicPage(2, null, "", "", "", "", "updated", "newest", 12, 0))
                .thenReturn(Flux.empty());
        when(achievementRepository.countPublicPage(2, null, "", "", "", ""))
                .thenReturn(Mono.just(0L));

        StepVerifier.create(achievementService.getPublicList(
                        0, 12, 2, null, null, null, null, "not_a_sort_key", null))
                .expectNextCount(1)
                .verifyComplete();
    }

    @Test
    @DisplayName("drops out-of-channel topics instead of failing the request")
    void dropsOutOfChannelTopics() {
        // /honors sends one topic list built from the union of the alumni and achievement
        // catalogs to both endpoints, so 'startup' (alumni-only) must not 400 this one.
        passThroughCache();
        when(achievementRepository.findPublicFeatured(2, "", "startup,student_honor", "", "", "updated", "newest"))
                .thenReturn(Mono.empty());
        when(achievementRepository.findPublicPage(2, null, "", "startup,student_honor", "", "", "updated", "newest", 12, 0))
                .thenReturn(Flux.just(detail(3, "Student honor", "body")));
        when(achievementRepository.countPublicPage(2, null, "", "startup,student_honor", "", ""))
                .thenReturn(Mono.just(1L));

        StepVerifier.create(achievementService.getPublicList(
                        0, 12, 2, null, "student_honor,startup", null, null, null, null))
                .assertNext(response -> assertThat(response.getItems())
                        .extracting(AchievementResponse::getId).containsExactly(3))
                .verifyComplete();
    }
}
