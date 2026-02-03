package com.service.backend.article.usecase.article;

import com.service.backend.article.domain.entity.LearningResource;
import com.service.backend.article.domain.repository.ILearningResourceRepository;
import com.service.backend.article.presentation.dto.request.CreateLearningResourceRequest;
import com.service.backend.article.presentation.dto.request.UpdateLearningResourceRequest;
import com.service.backend.article.presentation.dto.response.LearningResourceResponse;
import com.service.backend.article.presentation.dto.response.PaginatedResponse;
import com.service.backend.shared.constants.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class LearningResourceService {

    private final ILearningResourceRepository learningResourceRepository;

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
                .build();

        return learningResourceRepository.create(resource)
                .map(LearningResourceResponse::from);
    }

    public Mono<LearningResourceResponse> update(Integer id, UpdateLearningResourceRequest request) {
        return learningResourceRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.LEARNING_RESOURCE_NOT_FOUND, "Learning resource not found with id: " + id)))
                .flatMap(existing -> {
                    LearningResource updated = LearningResource.builder()
                            .title(request.getTitle())
                            .type(request.getType())
                            .linkUrl(request.getLinkUrl())
                            .description(request.getDescription())
                            .build();
                    return learningResourceRepository.update(id, updated);
                })
                .map(LearningResourceResponse::from);
    }

    public Mono<Boolean> delete(Integer id) {
        return learningResourceRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.LEARNING_RESOURCE_NOT_FOUND, "Learning resource not found with id: " + id)))
                .flatMap(existing -> learningResourceRepository.delete(id));
    }

    public Mono<LearningResourceResponse> getById(Integer id) {
        return learningResourceRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.LEARNING_RESOURCE_NOT_FOUND, "Learning resource not found with id: " + id)))
                .map(LearningResourceResponse::from);
    }

    public Mono<PaginatedResponse<LearningResourceResponse>> getAll(int page, int limit) {
        return learningResourceRepository.findByOrganizationId(MOCK_ORGANIZATION_ID, page, limit)
                .map(paginatedResponse -> PaginatedResponse.of(
                        paginatedResponse.getItems().stream().map(LearningResourceResponse::from).toList(),
                        paginatedResponse.getTotal(),
                        paginatedResponse.getPage(),
                        paginatedResponse.getLimit()
                ));
    }

    public Mono<PaginatedResponse<LearningResourceResponse>> getByType(String type, int page, int limit) {
        return learningResourceRepository.findByType(MOCK_ORGANIZATION_ID, type, page, limit)
                .map(paginatedResponse -> PaginatedResponse.of(
                        paginatedResponse.getItems().stream().map(LearningResourceResponse::from).toList(),
                        paginatedResponse.getTotal(),
                        paginatedResponse.getPage(),
                        paginatedResponse.getLimit()
                ));
    }

    public Mono<PaginatedResponse<LearningResourceResponse>> search(String keyword, int page, int limit) {
        return learningResourceRepository.search(MOCK_ORGANIZATION_ID, keyword, page, limit)
                .map(paginatedResponse -> PaginatedResponse.of(
                        paginatedResponse.getItems().stream().map(LearningResourceResponse::from).toList(),
                        paginatedResponse.getTotal(),
                        paginatedResponse.getPage(),
                        paginatedResponse.getLimit()
                ));
    }
}
