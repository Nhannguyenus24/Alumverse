package com.service.backend.article.usecase;

import com.service.backend.article.dao.LearningResourceR2dbcRepository;
import com.service.backend.article.entity.LearningResource;
import com.service.backend.article.dto.CreateLearningResourceRequest;
import com.service.backend.article.dto.UpdateLearningResourceRequest;
import com.service.backend.article.dto.LearningResourceResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.constants.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class LearningResourceService {

    private final LearningResourceR2dbcRepository learningResourceRepository;

    private static final Integer MOCK_ORGANIZATION_ID = 1;
    private static final Integer MOCK_UPLOADER_MEMBER_ID = 1;

    public Mono<LearningResourceResponse> create(CreateLearningResourceRequest request) {
        LearningResource resource = LearningResource.builder()
                .organizationId(MOCK_ORGANIZATION_ID)
                .uploaderMemberId(MOCK_UPLOADER_MEMBER_ID)
                .title(request.getTitle())
                .type(request.getType())
                .linkUrl(request.getLinkUrl())
                .description(request.getDescription())
                .createdAt(LocalDateTime.now())
                .build();

        return learningResourceRepository.save(resource)
                .map(LearningResourceResponse::from);
    }

    public Mono<LearningResourceResponse> update(Integer id, UpdateLearningResourceRequest request) {
        return learningResourceRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.LEARNING_RESOURCE_NOT_FOUND, "Learning resource not found with id: " + id)))
                .flatMap(existing -> {
                    existing.setTitle(request.getTitle());
                    existing.setType(request.getType());
                    existing.setLinkUrl(request.getLinkUrl());
                    existing.setDescription(request.getDescription());
                    return learningResourceRepository.save(existing);
                })
                .map(LearningResourceResponse::from);
    }

    public Mono<Boolean> delete(Integer id) {
        return learningResourceRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.LEARNING_RESOURCE_NOT_FOUND, "Learning resource not found with id: " + id)))
                .flatMap(existing -> learningResourceRepository.deleteById(id).thenReturn(true));
    }

    public Mono<LearningResourceResponse> getById(Integer id) {
        return learningResourceRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.LEARNING_RESOURCE_NOT_FOUND, "Learning resource not found with id: " + id)))
                .map(LearningResourceResponse::from);
    }

    public Mono<PaginatedResponse<LearningResourceResponse>> getAll(int page, int limit) {
        int offset = page * limit;
        return learningResourceRepository.findByOrganizationIdWithPagination(MOCK_ORGANIZATION_ID, limit, offset)
                .collectList()
                .zipWith(learningResourceRepository.countByOrganizationId(MOCK_ORGANIZATION_ID))
                .map(tuple -> PaginatedResponse.of(
                        tuple.getT1().stream().map(LearningResourceResponse::from).toList(),
                        tuple.getT2(), page, limit
                ));
    }

    public Mono<PaginatedResponse<LearningResourceResponse>> getByType(String type, int page, int limit) {
        int offset = page * limit;
        return learningResourceRepository.findByType(MOCK_ORGANIZATION_ID, type, limit, offset)
                .collectList()
                .zipWith(learningResourceRepository.countByType(MOCK_ORGANIZATION_ID, type))
                .map(tuple -> PaginatedResponse.of(
                        tuple.getT1().stream().map(LearningResourceResponse::from).toList(),
                        tuple.getT2(), page, limit
                ));
    }

    public Mono<PaginatedResponse<LearningResourceResponse>> search(String keyword, int page, int limit) {
        int offset = page * limit;
        return learningResourceRepository.searchResources(MOCK_ORGANIZATION_ID, keyword, limit, offset)
                .collectList()
                .zipWith(learningResourceRepository.countSearchResources(MOCK_ORGANIZATION_ID, keyword))
                .map(tuple -> PaginatedResponse.of(
                        tuple.getT1().stream().map(LearningResourceResponse::from).toList(),
                        tuple.getT2(), page, limit
                ));
    }
}
