package com.service.backend.article.service;

import com.service.backend.article.dao.LearningResourceR2dbcRepository;
import com.service.backend.shared.entity.LearningResource;
import com.service.backend.article.dto.CreateLearningResourceRequest;
import com.service.backend.article.dto.UpdateLearningResourceRequest;
import com.service.backend.article.dto.LearningResourceResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.enums.Status;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.utils.PaginationHelper;
import com.service.backend.shared.utils.SecurityUtils;
import com.service.backend.shared.utils.CacheNames;
import com.service.backend.shared.utils.CacheUtils;
import com.service.backend.shared.service.ImageService;
import com.service.backend.user.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class LearningResourceService {

    private static final Duration LIST_TTL = Duration.ofMinutes(5);

    private final LearningResourceR2dbcRepository learningResourceRepository;
    private final CacheUtils cacheUtils;
    private final ImageService imageService;
    private final NotificationService notificationService;

    /**
     * Clears the learning-resource list cache and the admin content-statistics cache. Called by every
     * write that changes what the lists (getAll/getByType/search) or the content counts return:
     * create/update/delete. The admin status change (AdminArticleService.updateLearningResourceStatus)
     * clears the same {@link CacheNames#LEARNING_RESOURCE} namespace directly.
     */
    private Mono<Void> evictLearningResourceCaches() {
        return cacheUtils.clear(CacheNames.LEARNING_RESOURCE)
                .then(cacheUtils.clear(CacheNames.ADMIN_CONTENT_STATISTICS));
    }

    public Mono<LearningResourceResponse> create(CreateLearningResourceRequest request) {
        return Mono.zip(SecurityUtils.getCurrentUserId(), SecurityUtils.getCurrentUserRole())
                .flatMap(ctx -> {
                    Long userId = ctx.getT1();
                    String role = ctx.getT2();
                    boolean publishImmediately = "ADMIN".equalsIgnoreCase(role) || "STAFF".equalsIgnoreCase(role);
                    // A base64 thumbnail is converted to WebP and stored; otherwise fall back to the URL.
                    return SecurityUtils.resolveContentOrganizationId(request.getOrganizationId())
                            .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.BAD_REQUEST, "Organization ID is required to create learning resource")))
                            .flatMap(orgId -> SecurityUtils.assertCanSubmitContributorContent(orgId)
                                    .then(imageService.uploadBase64IfPresent(request.getThumbnailBase64())
                            .defaultIfEmpty("")
                            .flatMap(thumbnailUrl -> {
                                LearningResource resource = LearningResource.builder()
                                        .organizationId(orgId)
                                        .uploaderMemberId(userId.intValue())
                                        .title(request.getTitle())
                                        .type(normalizeType(request.getType()))
                                        .linkUrl(request.getLinkUrl())
                                        .description(request.getDescription())
                                        .thumbnailUrl(thumbnailUrl.isEmpty() ? null : thumbnailUrl)
                                        .status(publishImmediately ? Status.APPROVED : Status.PENDING)
                                        .createdAt(LocalDateTime.now())
                                        .build();

                                return learningResourceRepository.save(resource)
                                        .delayUntil(res -> evictLearningResourceCaches())
                                        .doOnNext(saved -> {
                                            if (!publishImmediately) {
                                                notificationService.createNotificationAsync(
                                                        saved.getUploaderMemberId(),
                                                        "Cơ hội học tập đã được gửi",
                                                        "Bài viết \"" + saved.getTitle() + "\" đã được gửi. Admin sẽ xem xét trước khi hiển thị công khai.",
                                                        "/development/academics"
                                                );
                                            }
                                        })
                                        .map(LearningResourceResponse::from);
                            })));
                });
    }

    public Mono<LearningResourceResponse> update(Integer id, UpdateLearningResourceRequest request) {
        return learningResourceRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.LEARNING_RESOURCE_NOT_FOUND, "Learning resource not found with id: " + id)))
                .flatMap(existing -> SecurityUtils.assertCanManageContentOrganization(existing.getOrganizationId())
                        .then(imageService.uploadBase64IfPresent(request.getThumbnailBase64())
                        .map(Optional::of).defaultIfEmpty(Optional.empty())
                        .flatMap(uploadedThumbnail -> {
                            existing.setTitle(request.getTitle());
                            existing.setType(normalizeType(request.getType()));
                            existing.setLinkUrl(request.getLinkUrl());
                            existing.setDescription(request.getDescription());
                            uploadedThumbnail.ifPresent(newThumbnail -> existing.setThumbnailUrl(newThumbnail.isEmpty() ? null : newThumbnail));
                            return learningResourceRepository.save(existing);
                        })))
                .delayUntil(res -> evictLearningResourceCaches())
                .map(LearningResourceResponse::from);
    }

    public Mono<Boolean> delete(Integer id) {
        return learningResourceRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.LEARNING_RESOURCE_NOT_FOUND, "Learning resource not found with id: " + id)))
                .flatMap(existing -> SecurityUtils.assertCanManageContentOrganization(existing.getOrganizationId())
                        .then(learningResourceRepository.deleteById(id))
                        .then(evictLearningResourceCaches())
                        .thenReturn(true));
    }

    public Mono<LearningResourceResponse> getById(Integer id) {
        return learningResourceRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.LEARNING_RESOURCE_NOT_FOUND, "Learning resource not found with id: " + id)))
                .map(LearningResourceResponse::from);
    }

    public Mono<LearningResourceResponse> getPublicById(Integer id, Integer organizationId) {
        return SecurityUtils.resolvePublicOrganizationId(organizationId)
                .flatMap(orgId -> learningResourceRepository.findById(id)
                        .filter(resource -> orgId.equals(resource.getOrganizationId())
                                && Status.APPROVED.equals(resource.getStatus())))
                .switchIfEmpty(Mono.error(new ApplicationException(
                        ErrorCode.LEARNING_RESOURCE_NOT_FOUND, "Approved learning resource not found")))
                .map(LearningResourceResponse::from);
    }

    public Mono<PaginatedResponse<LearningResourceResponse>> getAll(int page, int limit) {
        return getAll(page, limit, null);
    }

    public Mono<PaginatedResponse<LearningResourceResponse>> getAll(int page, int limit, Integer organizationId) {
        int offset = page * limit;
        return SecurityUtils.resolvePublicOrganizationId(organizationId)
                .flatMap(orgId -> cacheUtils.getOrCompute(CacheNames.LEARNING_RESOURCE,
                        "all_org_" + orgId + "_p" + page + "_l" + limit, LIST_TTL, () -> PaginationHelper.paginate(
                                learningResourceRepository.findApprovedByOrganizationId(orgId, limit, offset).map(LearningResourceResponse::from),
                                learningResourceRepository.countApprovedByOrganizationId(orgId),
                                page, limit)))
                .switchIfEmpty(Mono.just(PaginatedResponse.of(java.util.List.of(), 0, page, limit)));
    }

    public Mono<PaginatedResponse<LearningResourceResponse>> getByType(String type, int page, int limit) {
        int offset = page * limit;
        String resourceType = normalizeType(type);
        return SecurityUtils.getCurrentOrganizationId()
                .flatMap(orgId -> cacheUtils.getOrCompute(CacheNames.LEARNING_RESOURCE,
                        "type_" + resourceType + "_org_" + orgId + "_p" + page + "_l" + limit, LIST_TTL, () -> PaginationHelper.paginate(
                                learningResourceRepository.findByType(orgId, resourceType, limit, offset).map(LearningResourceResponse::from),
                                learningResourceRepository.countByType(orgId, resourceType),
                                page, limit)))
                .switchIfEmpty(Mono.defer(() -> cacheUtils.getOrCompute(CacheNames.LEARNING_RESOURCE,
                        "type_" + resourceType + "_global_p" + page + "_l" + limit, LIST_TTL, () -> PaginationHelper.paginate(
                                learningResourceRepository.findAll()
                                        .filter(r -> resourceType != null && resourceType.equalsIgnoreCase(r.getType()) && Status.APPROVED.equals(r.getStatus()))
                                        .skip(offset)
                                        .take(limit)
                                        .map(LearningResourceResponse::from),
                                learningResourceRepository.countAllApprovedByType(resourceType),
                                page, limit))));
    }

    public Mono<PaginatedResponse<LearningResourceResponse>> search(String keyword, int page, int limit) {
        return search(keyword, page, limit, null);
    }

    public Mono<PaginatedResponse<LearningResourceResponse>> search(String keyword, int page, int limit, Integer organizationId) {
        int offset = page * limit;
        return SecurityUtils.resolvePublicOrganizationId(organizationId)
                .flatMap(orgId -> cacheUtils.getOrCompute(CacheNames.LEARNING_RESOURCE,
                        "search_org_" + orgId + "_kw_" + keyword + "_p" + page + "_l" + limit, LIST_TTL, () -> PaginationHelper.paginate(
                                learningResourceRepository.searchResources(orgId, keyword, limit, offset).map(LearningResourceResponse::from),
                                learningResourceRepository.countSearchResources(orgId, keyword),
                                page, limit)))
                .switchIfEmpty(Mono.just(PaginatedResponse.of(java.util.List.of(), 0, page, limit)));
    }

    private String normalizeType(String type) {
        if (type == null || type.trim().isEmpty()) return null;
        return type.trim().toLowerCase().replace("-", "_");
    }
}
