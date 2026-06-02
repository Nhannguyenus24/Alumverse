package com.service.backend.article.service;

import com.service.backend.article.dao.LearningResourceR2dbcRepository;
import com.service.backend.shared.entity.LearningResource;
import com.service.backend.article.dto.CreateLearningResourceRequest;
import com.service.backend.article.dto.UpdateLearningResourceRequest;
import com.service.backend.article.dto.LearningResourceResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.enums.LearningResourceType;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class LearningResourceService {

    private final LearningResourceR2dbcRepository learningResourceRepository;

    public Mono<LearningResourceResponse> create(CreateLearningResourceRequest request) {
        return Mono.zip(SecurityUtils.getCurrentUserId(), SecurityUtils.getCurrentOrganizationId())
                .flatMap(ctx -> {
                    Long userId = ctx.getT1();
                    Integer orgId = ctx.getT2();
                    LearningResource resource = LearningResource.builder()
                            .organizationId(orgId)
                            .uploaderMemberId(userId.intValue())
                            .title(request.getTitle())
                            .type(LearningResourceType.valueOf(request.getType().toUpperCase()))
                            .linkUrl(request.getLinkUrl())
                            .description(request.getDescription())
                            .createdAt(LocalDateTime.now())
                            .build();

                    return learningResourceRepository.save(resource).map(LearningResourceResponse::from);
                });
    }

    public Mono<LearningResourceResponse> update(Integer id, UpdateLearningResourceRequest request) {
        return learningResourceRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.LEARNING_RESOURCE_NOT_FOUND, "Learning resource not found with id: " + id)))
                .flatMap(existing -> {
                    existing.setTitle(request.getTitle());
                    existing.setType(LearningResourceType.valueOf(request.getType().toUpperCase()));
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
        return SecurityUtils.getCurrentOrganizationId().flatMap(orgId ->
                learningResourceRepository.findByOrganizationIdWithPagination(orgId, limit, offset)
                        .collectList()
                        .zipWith(learningResourceRepository.countByOrganizationId(orgId))
                        .map(tuple -> PaginatedResponse.of(
                                tuple.getT1().stream().map(LearningResourceResponse::from).toList(),
                                tuple.getT2(), page, limit
                        )));
    }

    public Mono<PaginatedResponse<LearningResourceResponse>> getByType(String type, int page, int limit) {
        int offset = page * limit;
        LearningResourceType resourceType = LearningResourceType.valueOf(type.toUpperCase());
        return SecurityUtils.getCurrentOrganizationId().flatMap(orgId ->
                learningResourceRepository.findByType(orgId, resourceType, limit, offset)
                        .collectList()
                        .zipWith(learningResourceRepository.countByType(orgId, resourceType))
                        .map(tuple -> PaginatedResponse.of(
                                tuple.getT1().stream().map(LearningResourceResponse::from).toList(),
                                tuple.getT2(), page, limit
                        )));
    }

    public Mono<PaginatedResponse<LearningResourceResponse>> search(String keyword, int page, int limit) {
        int offset = page * limit;
        return SecurityUtils.getCurrentOrganizationId().flatMap(orgId ->
                learningResourceRepository.searchResources(orgId, keyword, limit, offset)
                        .collectList()
                        .zipWith(learningResourceRepository.countSearchResources(orgId, keyword))
                        .map(tuple -> PaginatedResponse.of(
                                tuple.getT1().stream().map(LearningResourceResponse::from).toList(),
                                tuple.getT2(), page, limit
                        )));
    }
}
