package com.service.backend.article.service;

import com.service.backend.article.dao.LearningResourceR2dbcRepository;
import com.service.backend.shared.entity.LearningResource;
import com.service.backend.article.dto.CreateLearningResourceRequest;
import com.service.backend.article.dto.UpdateLearningResourceRequest;
import com.service.backend.article.dto.LearningResourceResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.enums.LearningResourceType;
import com.service.backend.shared.enums.Status;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.utils.PaginationHelper;
import com.service.backend.shared.utils.SecurityUtils;
import com.service.backend.shared.utils.CacheUtils;
import com.service.backend.shared.service.ImageService;
import com.service.backend.user.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class LearningResourceService {

    private final LearningResourceR2dbcRepository learningResourceRepository;
    private final CacheUtils cacheUtils;
    private final ImageService imageService;
    private final NotificationService notificationService;

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
                                        .type(LearningResourceType.valueOf(request.getType().toUpperCase()))
                                        .linkUrl(request.getLinkUrl())
                                        .description(request.getDescription())
                                        .thumbnailUrl(thumbnailUrl.isEmpty() ? null : thumbnailUrl)
                                        .status(publishImmediately ? Status.APPROVED : Status.PENDING)
                                        .createdAt(LocalDateTime.now())
                                        .build();

                                return learningResourceRepository.save(resource)
                                        .delayUntil(res -> cacheUtils.clear("admin_content_statistics"))
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
                            existing.setType(LearningResourceType.valueOf(request.getType().toUpperCase()));
                            existing.setLinkUrl(request.getLinkUrl());
                            existing.setDescription(request.getDescription());
                            uploadedThumbnail.ifPresent(newThumbnail -> existing.setThumbnailUrl(newThumbnail.isEmpty() ? null : newThumbnail));
                            return learningResourceRepository.save(existing);
                        })))
                .delayUntil(res -> cacheUtils.clear("admin_content_statistics"))
                .map(LearningResourceResponse::from);
    }

    public Mono<Boolean> delete(Integer id) {
        return learningResourceRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.LEARNING_RESOURCE_NOT_FOUND, "Learning resource not found with id: " + id)))
                .flatMap(existing -> SecurityUtils.assertCanManageContentOrganization(existing.getOrganizationId())
                        .then(learningResourceRepository.deleteById(id))
                        .then(cacheUtils.clear("admin_content_statistics"))
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
                .flatMap(orgId -> PaginationHelper.paginate(
                        learningResourceRepository.findApprovedByOrganizationId(orgId, limit, offset).map(LearningResourceResponse::from),
                        learningResourceRepository.countApprovedByOrganizationId(orgId),
                        page, limit))
                .switchIfEmpty(Mono.just(PaginatedResponse.of(java.util.List.of(), 0, page, limit)));
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
                                .filter(r -> r.getType() == resourceType && Status.APPROVED.equals(r.getStatus()))
                                .skip(offset)
                                .take(limit)
                                .map(LearningResourceResponse::from),
                        learningResourceRepository.countAllApproved(),
                        page, limit)));
    }

    public Mono<PaginatedResponse<LearningResourceResponse>> search(String keyword, int page, int limit) {
        return search(keyword, page, limit, null);
    }

    public Mono<PaginatedResponse<LearningResourceResponse>> search(String keyword, int page, int limit, Integer organizationId) {
        int offset = page * limit;
        return SecurityUtils.resolvePublicOrganizationId(organizationId)
                .flatMap(orgId -> PaginationHelper.paginate(
                        learningResourceRepository.searchResources(orgId, keyword, limit, offset).map(LearningResourceResponse::from),
                        learningResourceRepository.countSearchResources(orgId, keyword),
                        page, limit))
                .switchIfEmpty(Mono.just(PaginatedResponse.of(java.util.List.of(), 0, page, limit)));
    }
}
