package com.service.backend.article.service;

import com.service.backend.article.dao.NewsR2dbcRepository;
import com.service.backend.article.dto.NewsResponse;
import com.service.backend.article.dto.NewsListItemResponse;
import com.service.backend.article.dto.PublishedNewsResponse;
import com.service.backend.article.dto.UpdateNewsRequest;
import com.service.backend.shared.entity.News;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.service.ImageService;
import com.service.backend.shared.utils.CacheUtils;
import com.service.backend.user.service.NotificationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;
import java.util.function.Supplier;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("NewsService Unit Tests")
class NewsServiceTest {

    @Mock private NewsR2dbcRepository newsRepository;
    @Mock private ImageService imageService;
    @Mock private CacheUtils cacheUtils;
    @Mock private NotificationService notificationService;

    @InjectMocks
    private NewsService newsService;

    private static reactor.util.context.Context adminContext() {
        return org.springframework.security.core.context.ReactiveSecurityContextHolder.withAuthentication(
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        "1", null,
                        java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_ADMIN"))));
    }

    // ─── getById ─────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("getById()")
    class GetById {

        @Test
        @DisplayName("should return news when found")
        void getById_success() {
            News news = News.builder()
                    .id(1)
                    .title("Test News")
                    .slug("test-news")
                    .isHidden(false)
                    .build();

            when(newsRepository.findById(1)).thenReturn(Mono.just(news));

            StepVerifier.create(newsService.getById(1))
                    .assertNext(dto -> {
                        assertThat(dto.getTitle()).isEqualTo("Test News");
                        assertThat(dto.getSlug()).isEqualTo("test-news");
                    })
                    .verifyComplete();
        }

        @Test
        @DisplayName("should retain complete rich content for detail responses")
        void getById_keepsFullContent() {
            String fullContent = "<p>" + "complete article content ".repeat(30) + "</p>";
            News news = News.builder().id(1).content(fullContent).build();
            when(newsRepository.findById(1)).thenReturn(Mono.just(news));

            StepVerifier.create(newsService.getById(1))
                    .assertNext(dto -> assertThat(dto.getContent()).isEqualTo(fullContent))
                    .verifyComplete();
        }

        @Test
        @DisplayName("should fail when news not found")
        void getById_notFound() {
            when(newsRepository.findById(99)).thenReturn(Mono.empty());

            StepVerifier.create(newsService.getById(99))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.NEWS_NOT_FOUND)
                    .verify();
        }
    }

    // ─── public published list ───────────────────────────────────────────────

    @Nested
    @DisplayName("getPublishedList()")
    class GetPublishedList {

        @SuppressWarnings("unchecked")
        private void passThroughCache() {
            when(cacheUtils.<PublishedNewsResponse>getOrCompute(
                    eq("news_cache"), anyString(), any(), any()))
                    .thenAnswer(invocation -> ((Supplier<Mono<PublishedNewsResponse>>) invocation.getArgument(3)).get());
        }

        @Test
        @DisplayName("should return fixed featured separately and paginate only filtered non-featured items")
        void separatesFeaturedAndUsesBackendFilters() {
            passThroughCache();
            NewsListItemResponse featured = item(10, "Newest fixed article");
            NewsListItemResponse result = item(7, "Matching article");
            when(newsRepository.findPublishedFeatured(3)).thenReturn(Mono.just(featured));
            when(newsRepository.findPublishedList(
                    3, 10, "reactive", "academic_research,alumni_news",
                    "2026-08-01", "2026-08-07", "oldest", 15, 15))
                    .thenReturn(reactor.core.publisher.Flux.just(result));
            when(newsRepository.countPublishedList(
                    3, 10, "reactive", "academic_research,alumni_news",
                    "2026-08-01", "2026-08-07"))
                    .thenReturn(Mono.just(16L));

            StepVerifier.create(newsService.getPublishedList(
                            1, 15, 3, " reactive ", "alumni_news,academic_research",
                            LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 7), "oldest"))
                    .assertNext(response -> {
                        assertThat(response.getFeatured()).isSameAs(featured);
                        assertThat(response.getItems()).containsExactly(result);
                        assertThat(response.getTotalItem()).isEqualTo(16);
                        assertThat(response.getTotalPage()).isEqualTo(2);
                        assertThat(response.getCurrentPage()).isEqualTo(1);
                        assertThat(response.getPageSize()).isEqualTo(15);
                        assertThat(response.getHasPrevious()).isTrue();
                        assertThat(response.getHasNext()).isFalse();
                    })
                    .verifyComplete();

            verify(newsRepository).findPublishedFeatured(3);
        }

        @Test
        @DisplayName("should keep featured independent from keyword and return empty filtered items")
        void featuredIsIndependentFromFilters() {
            passThroughCache();
            NewsListItemResponse featured = item(10, "Does not match");
            when(newsRepository.findPublishedFeatured(1)).thenReturn(Mono.just(featured));
            when(newsRepository.findPublishedList(
                    1, 10, "different", "", "", "", "newest", 15, 0))
                    .thenReturn(reactor.core.publisher.Flux.empty());
            when(newsRepository.countPublishedList(1, 10, "different", "", "", ""))
                    .thenReturn(Mono.just(0L));

            StepVerifier.create(newsService.getPublishedList(
                            0, 15, 1, "different", "", null, null, "newest"))
                    .assertNext(response -> {
                        assertThat(response.getFeatured()).isSameAs(featured);
                        assertThat(response.getItems()).isEmpty();
                        assertThat(response.getTotalItem()).isZero();
                        assertThat(response.getTotalPage()).isZero();
                    })
                    .verifyComplete();
        }

        @Test
        @DisplayName("should parse, decode, normalize and safely truncate list content in Java")
        void transformsHtmlContentIntoPreview() {
            passThroughCache();
            NewsListItemResponse featured = item(10, "Featured");
            featured.setContent("<p>AT&amp;T&nbsp;news</p><p>" + "long text ".repeat(40) + "😀</p>");
            NewsListItemResponse result = item(7, "Result");
            result.setContent("<div>First&nbsp; line</div>\n<div>Second &quot;line&quot;</div>");
            NewsListItemResponse surrogateBoundary = item(6, "Surrogate boundary");
            surrogateBoundary.setContent("a".repeat(259) + "😀suffix");
            when(newsRepository.findPublishedFeatured(1)).thenReturn(Mono.just(featured));
            when(newsRepository.findPublishedList(1, 10, "", "", "", "", "newest", 15, 0))
                    .thenReturn(reactor.core.publisher.Flux.just(result, surrogateBoundary));
            when(newsRepository.countPublishedList(1, 10, "", "", "", ""))
                    .thenReturn(Mono.just(2L));

            StepVerifier.create(newsService.getPublishedList(
                            0, 15, 1, null, null, null, null, null))
                    .assertNext(response -> {
                        assertThat(response.getFeatured().getContent())
                                .startsWith("AT&T news long text")
                                .doesNotContain("<p>", "&amp;", "&nbsp;")
                                .hasSizeLessThanOrEqualTo(260);
                        assertThat(response.getItems().get(0).getContent())
                                .isEqualTo("First line Second \"line\"");
                        assertThat(response.getItems().get(1).getContent())
                                .isEqualTo("a".repeat(259));
                    })
                    .verifyComplete();
        }

        @Test
        @DisplayName("should include every filter dimension in the cache key")
        void cacheKeyContainsAllFilters() {
            when(cacheUtils.<PublishedNewsResponse>getOrCompute(
                    eq("news_cache"), anyString(), any(), any()))
                    .thenReturn(Mono.just(PublishedNewsResponse.of(null, List.of(), 0, 2, 12)));

            StepVerifier.create(newsService.getPublishedList(
                            2, 12, 4, "Campus", "alumni_news",
                            LocalDate.of(2026, 1, 2), LocalDate.of(2026, 2, 3), "oldest"))
                    .expectNextCount(1)
                    .verifyComplete();

            verify(cacheUtils).getOrCompute(
                    eq("news_cache"),
                    eq("published-v2|org=4|page=2|limit=12|keyword=campus|topics=alumni_news|from=2026-01-02|to=2026-02-03|sort=oldest"),
                    any(), any());
        }

        private NewsListItemResponse item(Integer id, String title) {
            NewsListItemResponse item = new NewsListItemResponse();
            item.setId(id);
            item.setTitle(title);
            item.setContent("bounded preview");
            return item;
        }
    }

    // ─── getBySlug ────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("getBySlug()")
    class GetBySlug {

        @Test
        @DisplayName("should return news by slug")
        void getBySlug_success() {
            News news = News.builder()
                    .id(1)
                    .title("Test News")
                    .slug("test-news")
                    .isHidden(false)
                    .build();

            when(newsRepository.findBySlug("test-news")).thenReturn(Mono.just(news));

            StepVerifier.create(newsService.getBySlug("test-news"))
                    .assertNext(dto -> assertThat(dto.getSlug()).isEqualTo("test-news"))
                    .verifyComplete();
        }
    }

    // ─── publish ──────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("publish()")
    class Publish {

        @Test
        @DisplayName("should publish news successfully")
        void publish_success() {
            News existing = News.builder()
                    .id(1)
                    .organizationId(1)
                    .title("Draft News")
                    .isHidden(true)
                    .build();
            
            News published = News.builder()
                    .id(1)
                    .title("Draft News")
                    .isHidden(false)
                    .build();

            when(newsRepository.findById(1)).thenReturn(Mono.just(existing), Mono.just(published));
            when(newsRepository.publishNews(1)).thenReturn(Mono.just(1));
            when(cacheUtils.clear(anyString())).thenReturn(Mono.empty());

            StepVerifier.create(newsService.publish(1)
                            .contextWrite(adminContext()))
                    .assertNext(dto -> assertThat(dto.getIsHidden()).isFalse())
                    .verifyComplete();
        }
    }

    // ─── hide ────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("hide()")
    class Hide {

        @Test
        @DisplayName("should hide news")
        void hide_success() {
            News existing = News.builder()
                    .id(1)
                    .organizationId(1)
                    .title("Published News")
                    .isHidden(false)
                    .build();
                    
            News hidden = News.builder()
                    .id(1)
                    .title("Published News")
                    .isHidden(true)
                    .build();

            when(newsRepository.findById(1)).thenReturn(Mono.just(existing), Mono.just(hidden));
            when(newsRepository.hideNews(1)).thenReturn(Mono.just(1));
            when(cacheUtils.clear(anyString())).thenReturn(Mono.empty());

            StepVerifier.create(newsService.hide(1)
                            .contextWrite(adminContext()))
                    .assertNext(dto -> assertThat(dto.getIsHidden()).isTrue())
                    .verifyComplete();
        }
    }

    // ─── delete ──────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("delete()")
    class Delete {

        @Test
        @DisplayName("should delete news successfully")
        void delete_success() {
            News news = News.builder()
                    .id(1)
                    .organizationId(1)
                    .title("News to Delete")
                    .build();

            when(newsRepository.findById(1)).thenReturn(Mono.just(news));
            when(newsRepository.deleteById(1)).thenReturn(Mono.empty());
            when(cacheUtils.clear(anyString())).thenReturn(Mono.empty());

            StepVerifier.create(newsService.delete(1)
                            .contextWrite(adminContext()))
                    .assertNext(result -> assertThat(result).isTrue())
                    .verifyComplete();
        }
    }

    // ─── update ──────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("update()")
    class Update {

        @Test
        @DisplayName("should update news successfully")
        void update_success() {
            News existing = News.builder()
                    .id(1)
                    .organizationId(1)
                    .title("Old Title")
                    .content("Old Content")
                    .build();

            News updated = News.builder()
                    .id(1)
                    .title("New Title")
                    .content("New Content")
                    .build();

            UpdateNewsRequest request = new UpdateNewsRequest();
            request.setTitle("New Title");
            request.setContent("New Content");

            when(newsRepository.findById(1)).thenReturn(Mono.just(existing));
            when(imageService.uploadBase64IfPresent(any())).thenReturn(Mono.empty());
            when(newsRepository.save(any())).thenReturn(Mono.just(updated));
            when(cacheUtils.clear(anyString())).thenReturn(Mono.empty());

            StepVerifier.create(newsService.update(1, request)
                            .contextWrite(adminContext()))
                    .assertNext(dto -> assertThat(dto.getTitle()).isEqualTo("New Title"))
                    .verifyComplete();
        }
    }
}
