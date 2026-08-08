package com.service.backend.article.service;

import com.service.backend.article.dao.AlumniPostR2dbcRepository;
import com.service.backend.article.dto.AlumniPostResponse;
import com.service.backend.shared.dto.FeaturedPaginatedResponse;
import com.service.backend.shared.entity.AlumniPost;
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
@DisplayName("AlumniPostService.getPublishedList()")
class AlumniPostPublicListTest {

    @Mock private AlumniPostR2dbcRepository alumniPostRepository;
    @Mock private ImageService imageService;
    @Mock private CacheUtils cacheUtils;
    @Mock private NotificationService notificationService;

    @InjectMocks
    private AlumniPostService alumniPostService;

    @SuppressWarnings("unchecked")
    private void passThroughCache() {
        when(cacheUtils.<FeaturedPaginatedResponse<AlumniPostResponse>>getOrCompute(
                eq("alumni_post_cache"), anyString(), any(), any()))
                .thenAnswer(invocation -> ((Supplier<Mono<FeaturedPaginatedResponse<AlumniPostResponse>>>)
                        invocation.getArgument(3)).get());
    }

    private static AlumniPost post(Integer id, String title, String content) {
        return AlumniPost.builder().id(id).title(title).content(content).build();
    }

    @Test
    @DisplayName("normalizes filters, excludes featured from the page, and reports the server total")
    void filtersAndPaginates() {
        passThroughCache();
        when(alumniPostRepository.findPublicFeatured(
                2, "startup", "entrepreneur,startup", "2026-07-01", "2026-08-07", "newest"))
                .thenReturn(Mono.just(post(8, "Featured", "<p>Featured body</p>")));
        when(alumniPostRepository.findPublicPage(
                2, 8, "startup", "entrepreneur,startup", "2026-07-01", "2026-08-07", "newest", 12, 0))
                .thenReturn(Flux.just(post(6, "Result", "<p>Result body</p>")));
        when(alumniPostRepository.countPublicPage(
                2, 8, "startup", "entrepreneur,startup", "2026-07-01", "2026-08-07"))
                .thenReturn(Mono.just(25L));

        StepVerifier.create(alumniPostService.getPublishedList(
                        0, 12, 2, "  startup  ", "startup,entrepreneur",
                        LocalDate.of(2026, 7, 1), LocalDate.of(2026, 8, 7), "newest"))
                .assertNext(response -> {
                    assertThat(response.getFeatured().getId()).isEqualTo(8);
                    assertThat(response.getItems()).extracting(AlumniPostResponse::getId).containsExactly(6);
                    assertThat(response.getTotalItem()).isEqualTo(25);
                    assertThat(response.getTotalPage()).isEqualTo(3);
                    assertThat(response.getHasNext()).isTrue();
                    assertThat(response.getHasPrevious()).isFalse();
                })
                .verifyComplete();
    }

    @Test
    @DisplayName("strips HTML and bounds content length on both featured and items")
    void trimsContent() {
        passThroughCache();
        String longBody = "<p>" + "x".repeat(400) + "</p>";
        when(alumniPostRepository.findPublicFeatured(2, "", "", "", "", "newest"))
                .thenReturn(Mono.just(post(1, "Featured", longBody)));
        when(alumniPostRepository.findPublicPage(2, 1, "", "", "", "", "newest", 12, 0))
                .thenReturn(Flux.just(post(2, "Item", "<p><b>Bold</b> body</p>")));
        when(alumniPostRepository.countPublicPage(2, 1, "", "", "", ""))
                .thenReturn(Mono.just(1L));

        StepVerifier.create(alumniPostService.getPublishedList(
                        0, 12, 2, null, null, null, null, null))
                .assertNext(response -> {
                    assertThat(response.getFeatured().getContent()).hasSize(260).doesNotContain("<p>");
                    assertThat(response.getItems().get(0).getContent()).isEqualTo("Bold body");
                })
                .verifyComplete();
    }

    @Test
    @DisplayName("passes null featuredId through when the filtered set is empty")
    void emptyFeatured() {
        passThroughCache();
        when(alumniPostRepository.findPublicFeatured(2, "", "", "", "", "oldest"))
                .thenReturn(Mono.empty());
        when(alumniPostRepository.findPublicPage(2, null, "", "", "", "", "oldest", 12, 0))
                .thenReturn(Flux.empty());
        when(alumniPostRepository.countPublicPage(2, null, "", "", "", ""))
                .thenReturn(Mono.just(0L));

        StepVerifier.create(alumniPostService.getPublishedList(
                        0, 12, 2, null, null, null, null, "oldest"))
                .assertNext(response -> {
                    assertThat(response.getFeatured()).isNull();
                    assertThat(response.getItems()).isEmpty();
                    assertThat(response.getTotalPage()).isZero();
                })
                .verifyComplete();
    }

    @Test
    @DisplayName("drops out-of-channel topics instead of failing the request")
    void dropsOutOfChannelTopics() {
        // /honors sends one topic list built from the union of the alumni and achievement
        // catalogs to both endpoints, so 'student_honor' (achievement-only) must not 400 this one.
        passThroughCache();
        when(alumniPostRepository.findPublicFeatured(2, "", "startup,student_honor", "", "", "newest"))
                .thenReturn(Mono.empty());
        when(alumniPostRepository.findPublicPage(2, null, "", "startup,student_honor", "", "", "newest", 12, 0))
                .thenReturn(Flux.just(post(3, "Startup story", "body")));
        when(alumniPostRepository.countPublicPage(2, null, "", "startup,student_honor", "", ""))
                .thenReturn(Mono.just(1L));

        StepVerifier.create(alumniPostService.getPublishedList(
                        0, 12, 2, null, "student_honor,startup", null, null, null))
                .assertNext(response -> assertThat(response.getItems())
                        .extracting(AlumniPostResponse::getId).containsExactly(3))
                .verifyComplete();
    }
}
