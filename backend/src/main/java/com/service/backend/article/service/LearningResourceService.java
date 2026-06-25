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
import com.service.backend.shared.utils.PaginationHelper;
import com.service.backend.shared.utils.SecurityUtils;
import com.service.backend.shared.utils.CacheUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class LearningResourceService {

    private final LearningResourceR2dbcRepository learningResourceRepository;
    private final CacheUtils cacheUtils;

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

                    return learningResourceRepository.save(resource)
                            .delayUntil(res -> cacheUtils.clear("admin_content_statistics"))
                            .map(LearningResourceResponse::from);
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
                    if (existing.getCreatedAt() == null) existing.setCreatedAt(LocalDateTime.now());
                    return learningResourceRepository.save(existing);
                })
                .delayUntil(res -> cacheUtils.clear("admin_content_statistics"))
                .map(LearningResourceResponse::from);
    }

    public Mono<Boolean> delete(Integer id) {
        return learningResourceRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.LEARNING_RESOURCE_NOT_FOUND, "Learning resource not found with id: " + id)))
                .flatMap(existing -> learningResourceRepository.deleteById(id)
                        .delayUntil(res -> cacheUtils.clear("admin_content_statistics"))
                        .thenReturn(true));
    }

    public Mono<LearningResourceResponse> getById(Integer id) {
        return learningResourceRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.LEARNING_RESOURCE_NOT_FOUND, "Learning resource not found with id: " + id)))
                .map(LearningResourceResponse::from);
    }

    public Mono<PaginatedResponse<LearningResourceResponse>> getAll(int page, int limit) {
        int offset = page * limit;
        return SecurityUtils.getCurrentOrganizationId()
                .flatMap(orgId -> PaginationHelper.paginate(
                        learningResourceRepository.findByOrganizationIdWithPagination(orgId, limit, offset).map(LearningResourceResponse::from),
                        learningResourceRepository.countByOrganizationId(orgId),
                        page, limit))
                .switchIfEmpty(Mono.defer(() -> PaginationHelper.paginate(
                        learningResourceRepository.findAllWithPagination(limit, offset).map(LearningResourceResponse::from),
                        learningResourceRepository.count(),
                        page, limit)));
    }

    public Mono<PaginatedResponse<LearningResourceResponse>> getByType(String type, int page, int limit) {
        int offset = page * limit;
        LearningResourceType resourceType = LearningResourceType.valueOf(type.toUpperCase());
        return SecurityUtils.getCurrentOrganizationId()
                .flatMap(orgId -> PaginationHelper.paginate(
                        learningResourceRepository.findByType(orgId, resourceType, limit, offset).map(LearningResourceResponse::from),
                        learningResourceRepository.countByType(orgId, resourceType),
                        page, limit))
                .switchIfEmpty(Mono.defer(() -> PaginationHelper.paginate(
                        learningResourceRepository.findAll()
                                .filter(r -> r.getType() == resourceType)
                                .skip(offset)
                                .take(limit)
                                .map(LearningResourceResponse::from),
                        learningResourceRepository.count(),
                        page, limit)));
    }

    public Mono<PaginatedResponse<LearningResourceResponse>> search(String keyword, int page, int limit) {
        int offset = page * limit;
        return SecurityUtils.getCurrentOrganizationId()
                .flatMap(orgId -> PaginationHelper.paginate(
                        learningResourceRepository.searchResources(orgId, keyword, limit, offset).map(LearningResourceResponse::from),
                        learningResourceRepository.countSearchResources(orgId, keyword),
                        page, limit))
                .switchIfEmpty(Mono.defer(() -> PaginationHelper.paginate(
                        learningResourceRepository.searchAllByTitleWithPagination(keyword, limit, offset).map(LearningResourceResponse::from),
                        learningResourceRepository.countAllSearchByTitle(keyword),
                        page, limit)));
    }
}
