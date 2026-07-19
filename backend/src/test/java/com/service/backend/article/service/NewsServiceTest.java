package com.service.backend.article.service;

import com.service.backend.article.dao.NewsR2dbcRepository;
import com.service.backend.article.dto.NewsResponse;
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
        @DisplayName("should fail when news not found")
        void getById_notFound() {
            when(newsRepository.findById(99)).thenReturn(Mono.empty());

            StepVerifier.create(newsService.getById(99))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.NEWS_NOT_FOUND)
                    .verify();
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
