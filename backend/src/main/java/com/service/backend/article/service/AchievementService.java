package com.service.backend.article.service;

import com.service.backend.article.dao.AchievementR2dbcRepository;
import com.service.backend.shared.entity.Achievement;
import com.service.backend.article.dto.CreateAchievementRequest;
import com.service.backend.article.dto.UpdateAchievementRequest;
import com.service.backend.article.dto.AchievementResponse;
import com.service.backend.article.validation.ArticleTopicCatalog;
import com.service.backend.shared.dto.FeaturedPaginatedResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.enums.Status;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.service.ImageService;
import com.service.backend.shared.utils.HtmlPreviewUtils;
import com.service.backend.shared.utils.JsonUtils;
import com.service.backend.shared.utils.PaginationHelper;
import com.service.backend.shared.utils.SecurityUtils;
import com.service.backend.shared.utils.CacheNames;
import com.service.backend.shared.utils.CacheUtils;
import com.service.backend.user.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AchievementService {

    private static final Duration LIST_TTL = Duration.ofMinutes(5);
    private static final int DESCRIPTION_PREVIEW_LENGTH = 260;

    private final AchievementR2dbcRepository achievementRepository;
    private final ImageService imageService;
    private final CacheUtils cacheUtils;
    private final NotificationService notificationService;

    public Mono<AchievementResponse> create(CreateAchievementRequest request) {
        String topic = ArticleTopicCatalog.requireValid(ArticleTopicCatalog.Channel.ACHIEVEMENT, request.getTopic());
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
                                            .topic(topic)
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
        String topic = request.getTopic() != null
                ? ArticleTopicCatalog.requireValid(ArticleTopicCatalog.Channel.ACHIEVEMENT, request.getTopic())
                : null;
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
                                    if (request.getTopic() != null) existing.setTopic(topic);
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
                        .filter(achievement -> orgId.equals(achievement.getOrganizationId()))
                        .flatMap(achievement -> Status.APPROVED.equals(achievement.getStatus())
                                ? Mono.just(achievement)
                                : SecurityUtils.canManageContentOrganization(achievement.getOrganizationId())
                                        .filter(Boolean::booleanValue)
                                        .map(ignored -> achievement)))
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
        String orgKey = organizationId.toString();
        String cacheKey = "status_" + status + "_org_" + orgKey + "_page_" + page + "_limit_" + limit;
        return cacheUtils.getOrCompute(CacheNames.ACHIEVEMENT, cacheKey, java.time.Duration.ofMinutes(5), () -> {
            int offset = page * limit;
            return PaginationHelper.paginate(
                    achievementRepository.findDetailsByStatusAndOrganizationId(status, organizationId, limit, offset)
                            .doOnNext(item -> log.debug("Fetched achievement with status {} and org {}: {}", status, organizationId, JsonUtils.toJson(item)))
                            .map(AchievementResponse::from),
                    achievementRepository.countByStatusAndOrganizationId(status, organizationId),
                    page, limit
            );
        });
    }

    /**
     * Public achievement list for the honors pages: server-side filtering, sorting and pagination,
     * plus a featured item that is excluded from {@code items} (and from the total) so it never
     * appears twice and never shifts the page boundaries.
     */
    public Mono<FeaturedPaginatedResponse<AchievementResponse>> getPublicList(
            int page,
            int limit,
            Integer organizationId,
            String keyword,
            String topics,
            LocalDate fromDate,
            LocalDate toDate,
            String sortBy,
            String direction) {
        String normalizedKeyword = keyword == null ? "" : keyword.trim();
        String normalizedTopics = normalizeTopics(topics);
        String normalizedSortBy = "awarded".equalsIgnoreCase(sortBy) ? "awarded" : "updated";
        String normalizedDirection = "oldest".equalsIgnoreCase(direction) ? "oldest" : "newest";
        String from = fromDate == null ? "" : fromDate.toString();
        String to = toDate == null ? "" : toDate.toString();
        int offset = page * limit;

        return SecurityUtils.resolvePublicOrganizationId(organizationId)
                .flatMap(orgId -> {
                    String cacheKey = String.join("|",
                            "public-list-v1",
                            "org=" + orgId,
                            "page=" + page,
                            "limit=" + limit,
                            "keyword=" + normalizedKeyword.toLowerCase(Locale.ROOT),
                            "topics=" + normalizedTopics,
                            "from=" + from,
                            "to=" + to,
                            "sortBy=" + normalizedSortBy,
                            "direction=" + normalizedDirection);

                    return cacheUtils.getOrCompute(CacheNames.ACHIEVEMENT, cacheKey, LIST_TTL,
                            () -> achievementRepository.findPublicFeatured(
                                            orgId, normalizedKeyword, normalizedTopics, from, to,
                                            normalizedSortBy, normalizedDirection)
                                    .map(AchievementResponse::from)
                                    .map(this::withDescriptionPreview)
                                    .map(Optional::of)
                                    .defaultIfEmpty(Optional.empty())
                                    .flatMap(featuredOptional -> {
                                        Integer featuredId = featuredOptional
                                                .map(AchievementResponse::getId)
                                                .orElse(null);
                                        Mono<List<AchievementResponse>> items = achievementRepository.findPublicPage(
                                                        orgId, featuredId, normalizedKeyword, normalizedTopics,
                                                        from, to, normalizedSortBy, normalizedDirection,
                                                        limit, offset)
                                                .map(AchievementResponse::from)
                                                .map(this::withDescriptionPreview)
                                                .collectList();
                                        Mono<Long> total = achievementRepository.countPublicPage(
                                                orgId, featuredId, normalizedKeyword, normalizedTopics, from, to);

                                        return Mono.zip(items, total)
                                                .map(result -> FeaturedPaginatedResponse.of(
                                                        featuredOptional.orElse(null),
                                                        result.getT1(), result.getT2(), page, limit));
                                    }));
                })
                .switchIfEmpty(Mono.just(FeaturedPaginatedResponse.of(
                        null, List.of(), 0, page, limit)));
    }

    /**
     * Descriptions are rich HTML. List cards only ever render a short excerpt, so strip the markup
     * and bound the length here instead of shipping whole articles down the wire. Detail endpoints
     * intentionally keep returning the full description.
     */
    private AchievementResponse withDescriptionPreview(AchievementResponse item) {
        item.setDescription(HtmlPreviewUtils.toPlainTextPreview(
                item.getDescription(), DESCRIPTION_PREVIEW_LENGTH));
        return item;
    }

    /**
     * Normalizes without validating against the achievement catalog. The /honors overview builds a
     * single topic filter from the union of the alumni and achievement catalogs and sends it to
     * both endpoints, so rejecting an out-of-channel topic here would 400 the whole page. Unknown
     * topics simply reach the query and match nothing, which is the intended result.
     */
    private String normalizeTopics(String topics) {
        if (topics == null || topics.isBlank()) {
            return "";
        }

        return Arrays.stream(topics.split(","))
                .map(ArticleTopicCatalog::normalize)
                .filter(topic -> topic != null && !topic.isBlank())
                .distinct()
                .sorted(Comparator.naturalOrder())
                .collect(Collectors.joining(","));
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
        return cacheUtils.clear(CacheNames.ADMIN_CONTENT_STATISTICS)
                .then(cacheUtils.clear(CacheNames.ACHIEVEMENT));
    }
}
