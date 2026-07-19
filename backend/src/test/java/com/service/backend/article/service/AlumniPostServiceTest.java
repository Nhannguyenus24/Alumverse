package com.service.backend.article.service;

import com.service.backend.article.dao.AlumniPostR2dbcRepository;
import com.service.backend.article.dto.UpdateAlumniPostRequest;
import com.service.backend.shared.entity.AlumniPost;
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
@DisplayName("AlumniPostService Unit Tests")
class AlumniPostServiceTest {

    @Mock private AlumniPostR2dbcRepository alumniPostRepository;
    @Mock private ImageService imageService;
    @Mock private CacheUtils cacheUtils;
    @Mock private NotificationService notificationService;

    @InjectMocks
    private AlumniPostService alumniPostService;

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
        @DisplayName("should return alumni post when found")
        void getById_success() {
            AlumniPost post = AlumniPost.builder()
                    .id(1)
                    .title("Alumni Story")
                    .slug("alumni-story")
                    .isHidden(false)
                    .build();

            when(alumniPostRepository.findById(1)).thenReturn(Mono.just(post));

            StepVerifier.create(alumniPostService.getById(1))
                    .assertNext(dto -> {
                        assertThat(dto.getTitle()).isEqualTo("Alumni Story");
                        assertThat(dto.getSlug()).isEqualTo("alumni-story");
                    })
                    .verifyComplete();
        }

        @Test
        @DisplayName("should fail when alumni post not found")
        void getById_notFound() {
            when(alumniPostRepository.findById(99)).thenReturn(Mono.empty());

            StepVerifier.create(alumniPostService.getById(99))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.ALUMNI_POST_NOT_FOUND)
                    .verify();
        }
    }

    // ─── getBySlug ────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("getBySlug()")
    class GetBySlug {

        @Test
        @DisplayName("should return alumni post by slug")
        void getBySlug_success() {
            AlumniPost post = AlumniPost.builder()
                    .id(1)
                    .title("Alumni Story")
                    .slug("alumni-story")
                    .isHidden(false)
                    .build();

            when(alumniPostRepository.findBySlug("alumni-story")).thenReturn(Mono.just(post));

            StepVerifier.create(alumniPostService.getBySlug("alumni-story"))
                    .assertNext(dto -> assertThat(dto.getSlug()).isEqualTo("alumni-story"))
                    .verifyComplete();
        }

        @Test
        @DisplayName("should fail when no alumni post found for slug")
        void getBySlug_notFound() {
            when(alumniPostRepository.findBySlug("invalid")).thenReturn(Mono.empty());

            StepVerifier.create(alumniPostService.getBySlug("invalid"))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.ALUMNI_POST_NOT_FOUND)
                    .verify();
        }
    }

    // ─── publish ──────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("publish()")
    class Publish {

        @Test
        @DisplayName("should publish alumni post")
        void publish_success() {
            AlumniPost existing = AlumniPost.builder()
                    .id(1)
                    .organizationId(1)
                    .title("Draft Post")
                    .isHidden(true)
                    .build();
            
            AlumniPost published = AlumniPost.builder()
                    .id(1)
                    .title("Draft Post")
                    .isHidden(false)
                    .build();

            when(alumniPostRepository.findById(1)).thenReturn(Mono.just(existing), Mono.just(published));
            when(alumniPostRepository.publishAlumniPost(1)).thenReturn(Mono.just(1));

            StepVerifier.create(alumniPostService.publish(1)
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
        @DisplayName("should hide post")
        void hide_success() {
            AlumniPost existing = AlumniPost.builder()
                    .id(1)
                    .organizationId(1)
                    .title("Published Post")
                    .isHidden(false)
                    .build();

            AlumniPost hidden = AlumniPost.builder()
                    .id(1)
                    .title("Published Post")
                    .isHidden(true)
                    .build();

            when(alumniPostRepository.findById(1)).thenReturn(Mono.just(existing), Mono.just(hidden));
            when(alumniPostRepository.hideAlumniPost(1)).thenReturn(Mono.just(1));

            StepVerifier.create(alumniPostService.hide(1)
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
        @DisplayName("should delete alumni post successfully")
        void delete_success() {
            AlumniPost post = AlumniPost.builder()
                    .id(1)
                    .organizationId(1)
                    .title("Post to Delete")
                    .build();

            when(alumniPostRepository.findById(1)).thenReturn(Mono.just(post));
            when(alumniPostRepository.deleteById(1)).thenReturn(Mono.empty());
            when(cacheUtils.clear(anyString())).thenReturn(Mono.empty());

            StepVerifier.create(alumniPostService.delete(1)
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
        @DisplayName("should update alumni post successfully")
        void update_success() {
            AlumniPost existing = AlumniPost.builder()
                    .id(1)
                    .organizationId(1)
                    .title("Old Title")
                    .content("Old Content")
                    .build();

            AlumniPost updated = AlumniPost.builder()
                    .id(1)
                    .title("New Title")
                    .content("New Content")
                    .build();

            UpdateAlumniPostRequest request = new UpdateAlumniPostRequest();
            request.setTitle("New Title");
            request.setContent("New Content");

            when(alumniPostRepository.findById(1)).thenReturn(Mono.just(existing));
            when(imageService.uploadBase64IfPresent(any())).thenReturn(Mono.empty());
            when(alumniPostRepository.save(any())).thenReturn(Mono.just(updated));
            when(cacheUtils.clear(anyString())).thenReturn(Mono.empty());

            StepVerifier.create(alumniPostService.update(1, request)
                            .contextWrite(adminContext()))
                    .assertNext(dto -> assertThat(dto.getTitle()).isEqualTo("New Title"))
                    .verifyComplete();
        }
    }
}
