package com.service.backend.article.service;

import com.service.backend.article.dao.LearningResourceR2dbcRepository;
import com.service.backend.article.dto.UpdateLearningResourceRequest;
import com.service.backend.shared.entity.LearningResource;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.enums.LearningResourceType;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.utils.CacheUtils;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import com.service.backend.shared.service.ImageService;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("LearningResourceService Unit Tests")
class LearningResourceServiceTest {

    @Mock private LearningResourceR2dbcRepository learningResourceRepository;
    @Mock private CacheUtils cacheUtils;
    @Mock private ImageService imageService;

    @InjectMocks
    private LearningResourceService learningResourceService;

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
                    .type(LearningResourceType.COURSE)
                    .build();

            when(learningResourceRepository.findById(1)).thenReturn(Mono.just(resource));

            StepVerifier.create(learningResourceService.getById(1))
                    .assertNext(dto -> {
                        assertThat(dto.getTitle()).isEqualTo("Java for Beginners");
                        assertThat(dto.getType()).isEqualTo(LearningResourceType.COURSE);
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
                    .title("Java for Beginners")
                    .build();

            when(learningResourceRepository.findById(1)).thenReturn(Mono.just(resource));
            when(learningResourceRepository.deleteById(1)).thenReturn(Mono.empty());
            when(cacheUtils.clear(anyString())).thenReturn(Mono.empty());

            StepVerifier.create(learningResourceService.delete(1))
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
                    .title("Old Title")
                    .linkUrl("http://old.com")
                    .type(LearningResourceType.COURSE)
                    .build();

            LearningResource updated = LearningResource.builder()
                    .id(1)
                    .title("New Title")
                    .linkUrl("http://new.com")
                    .type(LearningResourceType.EBOOK)
                    .build();

            UpdateLearningResourceRequest request = new UpdateLearningResourceRequest();
            request.setTitle("New Title");
            request.setLinkUrl("http://new.com");
            request.setType(LearningResourceType.EBOOK.getValue());

            when(learningResourceRepository.findById(1)).thenReturn(Mono.just(existing));
            when(imageService.uploadBase64IfPresent(any())).thenReturn(Mono.empty());
            when(learningResourceRepository.save(any())).thenReturn(Mono.just(updated));
            when(cacheUtils.clear(anyString())).thenReturn(Mono.empty());

            StepVerifier.create(learningResourceService.update(1, request))
                    .assertNext(dto -> {
                        assertThat(dto.getTitle()).isEqualTo("New Title");
                        assertThat(dto.getType()).isEqualTo(LearningResourceType.EBOOK);
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
}
