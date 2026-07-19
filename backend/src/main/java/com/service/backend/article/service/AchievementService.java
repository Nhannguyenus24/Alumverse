package com.service.backend.article.service;

import com.service.backend.article.dao.AchievementR2dbcRepository;
import com.service.backend.shared.entity.Achievement;
import com.service.backend.article.dto.CreateAchievementRequest;
import com.service.backend.article.dto.UpdateAchievementRequest;
import com.service.backend.article.dto.AchievementResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.enums.Status;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.service.ImageService;
import com.service.backend.shared.utils.JsonUtils;
import com.service.backend.shared.utils.PaginationHelper;
import com.service.backend.shared.utils.SecurityUtils;
import com.service.backend.shared.utils.CacheUtils;
import com.service.backend.user.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Slf4j
public class AchievementService {

    private final AchievementR2dbcRepository achievementRepository;
    private final ImageService imageService;
    private final CacheUtils cacheUtils;
    private final NotificationService notificationService;

    public Mono<AchievementResponse> create(CreateAchievementRequest request) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(userId -> SecurityUtils.resolveContentOrganizationId(request.getOrganizationId())
                        .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.BAD_REQUEST, "Organization ID is required to create achievement")))
                        .flatMap(orgId -> SecurityUtils.assertCanSubmitContributorContent(orgId)
                                .then(SecurityUtils.canManageContentOrganization(orgId))
                                .flatMap(canManage -> imageService.uploadBase64IfPresent(request.getImageBase64())
                                .defaultIfEmpty("")
                                .flatMap(imageUrl -> {
                                    Status initialStatus = canManage
                                            ? (request.getStatus() != null ? request.getStatus() : Status.PENDING)
                                            : Status.PENDING;
                                    Achievement achievement = Achievement.builder()
                                            .organizationId(orgId)
                                            .memberId(userId.intValue())
                                            .title(request.getTitle())
                                            .description(request.getDescription())
                                            .url(request.getUrl())
                                            .imageUrl(imageUrl.isEmpty() ? null : imageUrl)
                                            .awardedDate(request.getAwardedDate() != null ? request.getAwardedDate() : LocalDate.now())
                                            .topic(request.getTopic())
                                            .status(initialStatus)
                                            .build();

                                    return achievementRepository.save(achievement)
                                            .delayUntil(res -> clearAchievementCaches())
                                            .doOnNext(saved -> {
                                                if (Status.PENDING.equals(saved.getStatus())) {
                                                    notificationService.createNotificationAsync(
                                                            saved.getMemberId(),
                                                            "Bài vinh danh đã được gửi",
                                                            "Bài viết \"" + saved.getTitle() + "\" đã được gửi. Admin sẽ xem xét trước khi hiển thị công khai.",
                                                            "/honors/achievements"
                                                    );
                                            }
                                            })
                                            .map(AchievementResponse::from);
                                }))));
    }

    public Mono<AchievementResponse> update(Integer id, UpdateAchievementRequest request) {
        return achievementRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.ACHIEVEMENT_NOT_FOUND, "Achievement not found with id: " + id)))
                .flatMap(existing -> SecurityUtils.assertCanManageContentOrganization(existing.getOrganizationId())
                        .then(imageService.uploadBase64IfPresent(request.getImageBase64())
                                .defaultIfEmpty("")
                                .flatMap(imageUrl -> {
                                    existing.setTitle(request.getTitle());
                                    existing.setDescription(request.getDescription());
                                    existing.setUrl(request.getUrl());
                                    existing.setImageUrl(imageUrl.isEmpty() ? existing.getImageUrl() : imageUrl);
                                    if (request.getStatus() != null) existing.setStatus(request.getStatus());
                                    if (request.getTopic() != null) existing.setTopic(request.getTopic());
                                    return achievementRepository.save(existing);
                                })))
                .delayUntil(res -> clearAchievementCaches())
                .map(AchievementResponse::from);
    }

    public Mono<Boolean> delete(Integer id) {
        return achievementRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.ACHIEVEMENT_NOT_FOUND, "Achievement not found with id: " + id)))
                .flatMap(existing -> SecurityUtils.assertCanManageContentOrganization(existing.getOrganizationId())
                        .then(achievementRepository.deleteById(id))
                        .then(clearAchievementCaches())
                        .thenReturn(true));
    }

    public Mono<AchievementResponse> getById(Integer id) {
        return achievementRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.ACHIEVEMENT_NOT_FOUND, "Achievement not found with id: " + id)))
                .map(AchievementResponse::from);
    }

    public Mono<AchievementResponse> getPublicById(Integer id, Integer organizationId) {
        return SecurityUtils.resolvePublicOrganizationId(organizationId)
                .flatMap(orgId -> achievementRepository.findById(id)
                        .filter(achievement -> orgId.equals(achievement.getOrganizationId())
                                && Status.APPROVED.equals(achievement.getStatus())))
                .switchIfEmpty(Mono.error(new ApplicationException(
                        ErrorCode.ACHIEVEMENT_NOT_FOUND, "Approved achievement not found")))
                .map(AchievementResponse::from);
    }

    public Mono<PaginatedResponse<AchievementResponse>> getAll(int page, int limit) {
        int offset = page * limit;
        return PaginationHelper.paginate(
                achievementRepository.findAllWithPagination(limit, offset).map(AchievementResponse::from),
                achievementRepository.countAll(),
                page, limit
        );
    }

    public Mono<PaginatedResponse<AchievementResponse>> getByMemberId(Integer memberId, int page, int limit) {
        int offset = page * limit;
        return PaginationHelper.paginate(
                achievementRepository.findByMemberId(memberId, limit, offset).map(AchievementResponse::from),
                achievementRepository.countByMemberId(memberId),
                page, limit
        );
    }

    public Mono<PaginatedResponse<AchievementResponse>> getPublicByMemberId(
            Integer memberId, Integer organizationId, int page, int limit) {
        int offset = page * limit;
        return SecurityUtils.resolvePublicOrganizationId(organizationId)
                .flatMap(orgId -> PaginationHelper.paginate(
                        achievementRepository.findApprovedByMemberIdAndOrganizationId(memberId, orgId, limit, offset)
                                .map(AchievementResponse::from),
                        achievementRepository.countApprovedByMemberIdAndOrganizationId(memberId, orgId),
                        page, limit))
                .switchIfEmpty(Mono.just(PaginatedResponse.of(java.util.List.of(), 0, page, limit)));
    }

    public Mono<PaginatedResponse<AchievementResponse>> getMyAchievements(int page, int limit) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(userId -> getByMemberId(userId.intValue(), page, limit));
    }

    public Mono<PaginatedResponse<AchievementResponse>> getByStatus(Status status, Integer organizationId, int page, int limit) {
        if (organizationId == null) {
            return Mono.just(PaginatedResponse.of(java.util.List.of(), 0, page, limit));
        }
        String orgKey = organizationId != null ? organizationId.toString() : "all";
        String cacheKey = "status_" + status + "_org_" + orgKey + "_page_" + page + "_limit_" + limit;
        return cacheUtils.getOrCompute("achievement_cache", cacheKey, java.time.Duration.ofMinutes(5), () -> {
            int offset = page * limit;
            if (organizationId != null) {
                return PaginationHelper.paginate(
                        achievementRepository.findDetailsByStatusAndOrganizationId(status, organizationId, limit, offset)
                                .doOnNext(item -> log.info("Fetched achievement with status {} and org {}: {}", status, organizationId, JsonUtils.toJson(item)))
                                .map(AchievementResponse::from),
                        achievementRepository.countByStatusAndOrganizationId(status, organizationId),
                        page, limit
                );
            }
            return PaginationHelper.paginate(
                    achievementRepository.findDetailsByStatus(status, limit, offset)
                            .doOnNext(item -> log.info("Fetched achievement with status {}: {}", status, JsonUtils.toJson(item)))
                            .map(AchievementResponse::from),
                    achievementRepository.countByStatus(status),
                    page, limit
            );
        });
    }

    public Mono<PaginatedResponse<AchievementResponse>> search(String keyword, int page, int limit) {
        return search(keyword, page, limit, null);
    }

    public Mono<PaginatedResponse<AchievementResponse>> search(String keyword, int page, int limit, Integer organizationId) {
        int offset = page * limit;
        return SecurityUtils.resolvePublicOrganizationId(organizationId)
                .flatMap(orgId -> PaginationHelper.paginate(
                        achievementRepository.searchByOrganizationAndTitle(orgId, keyword, limit, offset).map(AchievementResponse::from),
                        achievementRepository.countSearchByOrganizationAndTitle(orgId, keyword),
                        page, limit))
                .switchIfEmpty(Mono.just(PaginatedResponse.of(java.util.List.of(), 0, page, limit)));
    }

    private Mono<Void> clearAchievementCaches() {
        return cacheUtils.clear("admin_content_statistics")
                .then(cacheUtils.clear("achievement_cache"));
    }
}
