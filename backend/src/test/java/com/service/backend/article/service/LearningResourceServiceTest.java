package com.service.backend.article.service;

import com.service.backend.article.dao.LearningResourceR2dbcRepository;
import com.service.backend.article.dto.UpdateLearningResourceRequest;
import com.service.backend.article.dto.LearningResourceResponse;
import com.service.backend.shared.entity.LearningResource;
import com.service.backend.shared.dto.FeaturedPaginatedResponse;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.utils.CacheUtils;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import com.service.backend.shared.service.ImageService;
import com.service.backend.user.service.NotificationService;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Flux;
import reactor.test.StepVerifier;

import java.time.LocalDate;
import java.util.function.Supplier;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("LearningResourceService Unit Tests")
class LearningResourceServiceTest {

    @Mock private LearningResourceR2dbcRepository learningResourceRepository;
    @Mock private CacheUtils cacheUtils;
    @Mock private ImageService imageService;
    @Mock private NotificationService notificationService;

    @InjectMocks
    private LearningResourceService learningResourceService;

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
        @DisplayName("should return learning resource when found")
        void getById_success() {
            LearningResource resource = LearningResource.builder()
                    .id(1)
                    .title("Java for Beginners")
                    .linkUrl("https://example.com/java")
                    .type("online_course")
                    .build();

            when(learningResourceRepository.findById(1)).thenReturn(Mono.just(resource));

            StepVerifier.create(learningResourceService.getById(1))
                    .assertNext(dto -> {
                        assertThat(dto.getTitle()).isEqualTo("Java for Beginners");
                        assertThat(dto.getType()).isEqualTo("online_course");
                    })
                    .verifyComplete();
        }

        @Test
        @DisplayName("should fail when resource not found")
        void getById_notFound() {
            when(learningResourceRepository.findById(99)).thenReturn(Mono.empty());

            StepVerifier.create(learningResourceService.getById(99))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.LEARNING_RESOURCE_NOT_FOUND)
                    .verify();
        }
    }

    // ─── delete ──────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("delete()")
    class Delete {

        @Test
        @DisplayName("should delete resource successfully")
        void delete_success() {
            LearningResource resource = LearningResource.builder()
                    .id(1)
                    .organizationId(1)
                    .title("Java for Beginners")
                    .build();

            when(learningResourceRepository.findById(1)).thenReturn(Mono.just(resource));
            when(learningResourceRepository.deleteById(1)).thenReturn(Mono.empty());
            when(cacheUtils.clear(anyString())).thenReturn(Mono.empty());

            StepVerifier.create(learningResourceService.delete(1)
                            .contextWrite(adminContext()))
                    .assertNext(result -> assertThat(result).isTrue())
                    .verifyComplete();
        }

        @Test
        @DisplayName("should fail when resource not found")
        void delete_notFound() {
            when(learningResourceRepository.findById(99)).thenReturn(Mono.empty());

            StepVerifier.create(learningResourceService.delete(99))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.LEARNING_RESOURCE_NOT_FOUND)
                    .verify();
        }
    }

    // ─── update ──────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("update()")
    class Update {

        @Test
        @DisplayName("should update resource successfully")
        void update_success() {
            LearningResource existing = LearningResource.builder()
                    .id(1)
                    .organizationId(1)
                    .title("Old Title")
                    .linkUrl("http://old.com")
                    .type("online_course")
                    .build();

            LearningResource updated = LearningResource.builder()
                    .id(1)
                    .title("New Title")
                    .linkUrl("http://new.com")
                    .type("masters_doctorate")
                    .build();

            UpdateLearningResourceRequest request = new UpdateLearningResourceRequest();
            request.setTitle("New Title");
            request.setLinkUrl("http://new.com");
            request.setType("masters_doctorate");

            when(learningResourceRepository.findById(1)).thenReturn(Mono.just(existing));
            when(imageService.uploadBase64IfPresent(any())).thenReturn(Mono.empty());
            when(learningResourceRepository.save(any())).thenReturn(Mono.just(updated));
            when(cacheUtils.clear(anyString())).thenReturn(Mono.empty());

            StepVerifier.create(learningResourceService.update(1, request)
                            .contextWrite(adminContext()))
                    .assertNext(dto -> {
                        assertThat(dto.getTitle()).isEqualTo("New Title");
                        assertThat(dto.getType()).isEqualTo("masters_doctorate");
                    })
                    .verifyComplete();
        }

        @Test
        @DisplayName("should fail when resource not found")
        void update_notFound() {
            UpdateLearningResourceRequest request = new UpdateLearningResourceRequest();
            request.setTitle("New Title");

            when(learningResourceRepository.findById(99)).thenReturn(Mono.empty());

            StepVerifier.create(learningResourceService.update(99, request))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.LEARNING_RESOURCE_NOT_FOUND)
                    .verify();
        }
    }

    // ─── getByType ────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("getByType()")
    class GetByType {
    }

    @Nested
    @DisplayName("getPublishedList()")
    class GetPublishedList {

        @Test
        @SuppressWarnings("unchecked")
        @DisplayName("should apply all filters and exclude featured from the backend page")
        void filtersAndPaginates() {
            when(cacheUtils.<FeaturedPaginatedResponse<LearningResourceResponse>>getOrCompute(
                    eq("learning_resource_cache"), anyString(), any(), any()))
                    .thenAnswer(invocation -> ((Supplier<Mono<FeaturedPaginatedResponse<LearningResourceResponse>>>)
                            invocation.getArgument(3)).get());
            LearningResource featured = LearningResource.builder()
                    .id(9)
                    .title("Featured")
                    .description("<p>Featured <strong>description</strong></p>")
                    .build();
            LearningResource item = LearningResource.builder()
                    .id(7)
                    .title("Result")
                    .description("<p>" + "x".repeat(300) + "</p>")
                    .build();
            when(learningResourceRepository.findPublicFeatured(
                    3, "java", "online_course,research", "2026-08-01", "2026-08-07", "oldest"))
                    .thenReturn(Mono.just(featured));
            when(learningResourceRepository.findPublicPage(
                    3, 9, "java", "online_course,research", "2026-08-01", "2026-08-07", "oldest", 12, 12))
                    .thenReturn(Flux.just(item));
            when(learningResourceRepository.countPublicPage(
                    3, 9, "java", "online_course,research", "2026-08-01", "2026-08-07"))
                    .thenReturn(Mono.just(13L));

            StepVerifier.create(learningResourceService.getPublishedList(
                            1, 12, 3, " java ", "research,online_course",
                            LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 7), "oldest"))
                    .assertNext(response -> {
                        assertThat(response.getFeatured().getId()).isEqualTo(9);
                        assertThat(response.getFeatured().getDescription()).isEqualTo("Featured description");
                        assertThat(response.getItems()).extracting(LearningResourceResponse::getId).containsExactly(7);
                        assertThat(response.getItems().get(0).getDescription()).hasSize(260).doesNotContain("<p>");
                        assertThat(response.getTotalItem()).isEqualTo(13);
                        assertThat(response.getTotalPage()).isEqualTo(2);
                    })
                    .verifyComplete();
        }
    }
}
