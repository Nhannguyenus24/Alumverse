package com.service.backend.admin.service;

import com.service.backend.forum.dto.ForumCategoryDTO;
import com.service.backend.forum.dto.ForumTopicDTO;
import com.service.backend.shared.entity.*;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.HashSet;
import java.util.Map;
import java.util.HashMap;
import java.util.Objects;
import java.util.stream.Collectors;
import com.service.backend.shared.dto.IdCountDTO;
import com.service.backend.shared.dao.UserDisplayInfo;

import com.service.backend.organization.dao.OrganizationRepository;
import com.service.backend.admin.dao.AdminUserRepository;
import com.service.backend.user.dao.UserProfileRepository;
import com.service.backend.user.service.NotificationService;
import com.service.backend.admin.dto.ForumStatisticsDTO;
import com.service.backend.admin.dto.MonthlyActivityDTO;
import com.service.backend.admin.dto.OrganizationEngagementDTO;
import com.service.backend.admin.dto.ReviewForumReportRequest;
import com.service.backend.admin.dto.TopContributorDTO;
import com.service.backend.forum.dao.ForumCategoryRepository;
import com.service.backend.forum.dao.ForumPostReportRepository;
import com.service.backend.forum.dao.ForumPostRepository;
import com.service.backend.forum.dao.ForumTopicRepository;
import com.service.backend.forum.dao.ForumTopicSubscriptionRepository;
import com.service.backend.forum.dao.ForumPostReactionRepository;
import com.service.backend.forum.dto.ForumPostDTO;
import com.service.backend.forum.dto.ForumPostReportDTO;
import com.service.backend.shared.enums.Status;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.utils.CacheNames;
import com.service.backend.shared.utils.CacheUtils;
import com.service.backend.shared.utils.JsonUtils;
import com.service.backend.shared.utils.PaginationHelper;
import com.service.backend.shared.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class AdminForumService {
    private static final Logger log = LoggerFactory.getLogger(AdminForumService.class);

    private final ForumPostRepository forumPostRepository;
    private final ForumPostReactionRepository forumPostReactionRepository;
    private final ForumTopicRepository forumTopicRepository;
    private final ForumTopicSubscriptionRepository forumTopicSubscriptionRepository;
    private final ForumCategoryRepository forumCategoryRepository;
    private final ForumPostReportRepository forumPostReportRepository;
    private final CacheUtils cacheUtils;
    private final OrganizationRepository organizationRepository;
    private final AdminUserRepository adminUserRepository;
    private final AdminAuditService adminAuditService;
    private final NotificationService notificationService;
    private final UserProfileRepository userProfileRepository;

    // ========== VIEW NEW POSTS ==========

    public Flux<ForumPostDTO> getNewForumPostsYesterday() {
        return forumPostRepository.findPostsCreatedYesterday()
                .transform(this::enrichPosts)
                .doOnError(error -> log.error("Error fetching forum posts created yesterday", error));
    }

    public Mono<PaginatedResponse<ForumPostDTO>> getNewForumPostsYesterdayWithPagination(Integer organizationId, int page, int size) {
        long offset = (long) page * size;
        if (organizationId != null) {
            return PaginationHelper.paginate(
                        forumPostRepository.findPostsCreatedYesterdayByOrganizationWithPagination(organizationId, size, (int) offset)
                                .transform(this::enrichPosts),
                        forumPostRepository.countPostsCreatedYesterdayByOrganization(organizationId),
                        page, size)
                    .doOnSuccess(r -> log.debug("getNewForumPostsYesterdayWithPagination (org={}) result: {}", organizationId, JsonUtils.toJson(r)))
                    .doOnError(error -> log.error("Error fetching yesterday posts for org {}", organizationId, error));
        }
        return PaginationHelper.paginate(
                    forumPostRepository.findPostsCreatedYesterdayWithPagination(size, offset)
                            .transform(this::enrichPosts),
                    forumPostRepository.countPostsCreatedYesterday(),
                    page, size)
                .doOnSuccess(r -> log.debug("getNewForumPostsYesterdayWithPagination result: {}", JsonUtils.toJson(r)))
                .doOnError(error -> log.error("Error fetching paginated forum posts created yesterday", error));
    }

    // ========== BAN/UNBAN POST ==========

    private Mono<Void> assertPostOrgOwnership(Integer topicId) {
        return forumTopicRepository.findById(topicId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.FORUM_TOPIC_NOT_FOUND)))
                .flatMap(topic -> SecurityUtils.assertSameOrganizationOrAdmin(topic.getOrganizationId()));
    }

    public Mono<ForumPostDTO> banForumPost(Integer postId) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(adminId -> forumPostRepository.findById(postId)
                        .switchIfEmpty(Mono.defer(() -> Mono.error(new ApplicationException(ErrorCode.FORUM_POST_NOT_FOUND))))
                        .flatMap(post -> assertPostOrgOwnership(post.getTopicId()).thenReturn(post))
                        .flatMap(post -> {
                            post.setIsBanned(true);
                            return forumPostRepository.save(post)
                                    .flatMap(saved -> createAuditLog(adminId.intValue(), post.getAuthorMemberId(),
                                            "BAN_POST", "FORUM_POST", String.valueOf(postId), null, null)
                                            .thenReturn(saved));
                        }))
                .flatMap(this::convertToPostDTO)
                .delayUntil(r -> cacheUtils.clear(CacheNames.FORUM_CATEGORY))
                .doOnSuccess(result -> log.debug("banForumPost result: {}", JsonUtils.toJson(result)))
                .doOnError(error -> log.error("Error banning forum post ID: {}", postId, error));
    }

    public Mono<ForumPostDTO> unbanForumPost(Integer postId) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(adminId -> forumPostRepository.findById(postId)
                        .switchIfEmpty(Mono.defer(() -> Mono.error(new ApplicationException(ErrorCode.FORUM_POST_NOT_FOUND))))
                        .flatMap(post -> assertPostOrgOwnership(post.getTopicId()).thenReturn(post))
                        .flatMap(post -> {
                            post.setIsBanned(false);
                            return forumPostRepository.save(post)
                                    .flatMap(saved -> createAuditLog(adminId.intValue(), post.getAuthorMemberId(),
                                            "UNBAN_POST", "FORUM_POST", String.valueOf(postId), null, null)
                                            .thenReturn(saved));
                        }))
                .flatMap(this::convertToPostDTO)
                .delayUntil(r -> cacheUtils.clear(CacheNames.FORUM_CATEGORY))
                .doOnSuccess(result -> log.debug("unbanForumPost result: {}", JsonUtils.toJson(result)))
                .doOnError(error -> log.error("Error unbanning forum post ID: {}", postId, error));
    }

    public Mono<Void> deleteForumPost(Integer postId) {
        return forumPostRepository.findById(postId)
                .switchIfEmpty(Mono.defer(() -> Mono.error(new ApplicationException(ErrorCode.FORUM_POST_NOT_FOUND))))
                .flatMap(post -> assertPostOrgOwnership(post.getTopicId())
                        .then(forumPostRepository.deleteById(postId)))
                .then(cacheUtils.clear(CacheNames.FORUM_CATEGORY))
                .doOnSuccess(v -> log.info("deleteForumPost: postId={} deleted", postId))
                .doOnError(error -> log.error("Error deleting forum post ID: {}", postId, error));
    }

    public Mono<PaginatedResponse<ForumPostDTO>> getBannedPostsWithPagination(Integer organizationId, int page, int size) {
        long offset = (long) page * size;
        if (organizationId != null) {
            return PaginationHelper.paginate(
                        forumPostRepository.findBannedPostsByOrganizationWithPagination(organizationId, size, (int) offset)
                                .transform(this::enrichPosts),
                        forumPostRepository.countBannedPostsByOrganization(organizationId),
                        page, size)
                    .doOnSuccess(r -> log.debug("getBannedPostsWithPagination (org={}) result: {}", organizationId, JsonUtils.toJson(r)))
                    .doOnError(error -> log.error("Error fetching banned posts for org {}", organizationId, error));
        }
        return PaginationHelper.paginate(
                    forumPostRepository.findAllBannedPostsWithPagination(size, offset)
                            .transform(this::enrichPosts),
                    forumPostRepository.countByIsBannedTrue(),
                    page, size)
                .doOnSuccess(r -> log.debug("getBannedPostsWithPagination result: {}", JsonUtils.toJson(r)))
                .doOnError(error -> log.error("Error fetching banned forum posts", error));
    }

    public Mono<PaginatedResponse<ForumPostDTO>> getHiddenPostsWithPagination(Integer organizationId, int page, int size) {
        long offset = (long) page * size;
        if (organizationId != null) {
            return PaginationHelper.paginate(
                        forumPostRepository.findHiddenPostsByOrganizationWithPagination(organizationId, size, (int) offset)
                                .transform(this::enrichPosts),
                        forumPostRepository.countHiddenPostsByOrganization(organizationId),
                        page, size)
                    .doOnSuccess(r -> log.debug("getHiddenPostsWithPagination (org={}) result: {}", organizationId, JsonUtils.toJson(r)))
                    .doOnError(error -> log.error("Error fetching hidden posts for org {}", organizationId, error));
        }
        return PaginationHelper.paginate(
                    forumPostRepository.findAllHiddenPostsWithPagination(size, offset)
                            .transform(this::enrichPosts),
                    forumPostRepository.countByIsHiddenTrue(),
                    page, size)
                .doOnSuccess(r -> log.debug("getHiddenPostsWithPagination result: {}", JsonUtils.toJson(r)))
                .doOnError(error -> log.error("Error fetching hidden forum posts", error));
    }

    public Mono<PaginatedResponse<ForumPostDTO>> getAllPostsWithPagination(Integer organizationId, String keyword, int page, int size) {
        long offset = (long) page * size;
        String kw = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        if (organizationId != null) {
            return PaginationHelper.paginate(
                        forumPostRepository.findAllPostsByOrganizationWithPagination(organizationId, kw, size, (int) offset)
                                .transform(this::enrichPosts),
                        forumPostRepository.countAllPostsByOrganization(organizationId, kw),
                        page, size)
                    .doOnSuccess(r -> log.debug("getAllPostsWithPagination (org={}) result: {}", organizationId, JsonUtils.toJson(r)))
                    .doOnError(error -> log.error("Error fetching posts for org {}", organizationId, error));
        }
        return PaginationHelper.paginate(
                    forumPostRepository.findAllPostsWithPagination(kw, size, offset)
                            .transform(this::enrichPosts),
                    forumPostRepository.countAllPostsWithKeyword(kw),
                    page, size)
                .doOnSuccess(r -> log.debug("getAllPostsWithPagination result (keyword={}): {}", kw, JsonUtils.toJson(r)))
                .doOnError(error -> log.error("Error fetching all forum posts with keyword={}", kw, error));
    }

    public Mono<PaginatedResponse<ForumPostReportDTO>> getPendingReports(Integer organizationId, int page, int size) {
        long offset = (long) page * size;
        if (organizationId != null) {
            return PaginationHelper.paginate(
                        forumPostReportRepository.findByOrganizationAndStatusWithPagination(organizationId, Status.PENDING, size, offset)
                                .map(this::convertToReportDTO),
                        forumPostReportRepository.countByOrganizationAndStatus(organizationId, Status.PENDING),
                        page, size)
                    .doOnSuccess(r -> log.debug("getPendingReports (org={}) result: {}", organizationId, JsonUtils.toJson(r)));
        }
        return PaginationHelper.paginate(
                    forumPostReportRepository.findByStatusWithPagination(Status.PENDING, size, offset)
                            .map(this::convertToReportDTO),
                    forumPostReportRepository.countByStatus(Status.PENDING),
                    page, size)
                .doOnSuccess(r -> log.debug("getPendingReports result: {}", JsonUtils.toJson(r)));
    }

    public Mono<ForumPostReportDTO> reviewReport(Long reportId, ReviewForumReportRequest request, Integer adminUserId) {
        return forumPostReportRepository.findById(reportId)
                .switchIfEmpty(Mono.defer(() -> Mono.error(new ApplicationException(ErrorCode.FORUM_REPORT_NOT_FOUND))))
                .flatMap(report -> {
                    String upperDecision = request.getDecision() == null ? null : request.getDecision().toUpperCase();
                    boolean isApproved = "APPROVED".equals(upperDecision);
                    Mono<Void> moderationMono = isApproved
                            ? applyModerationAction(report, request, adminUserId)
                            : Mono.empty();
                    return moderationMono.then(Mono.defer(() -> {
                        report.setStatus(Status.valueOf(upperDecision));
                        report.setReviewedByUserId(adminUserId);
                        report.setReviewNote(request.getReviewNote());
                        report.setUpdatedAt(LocalDateTime.now());
                        return forumPostReportRepository.save(report);
                    }));
                })
                .map(this::convertToReportDTO)
                .delayUntil(r -> cacheUtils.clear(CacheNames.FORUM_CATEGORY))
                .doOnSuccess(r -> log.debug("reviewReport result: {}", JsonUtils.toJson(r)));
    }

    public Mono<ForumPostDTO> updatePostVisibility(Integer postId, Boolean hidden, Integer adminUserId) {
        return forumPostRepository.findById(postId)
                .switchIfEmpty(Mono.defer(() -> Mono.error(new ApplicationException(ErrorCode.FORUM_POST_NOT_FOUND))))
                .flatMap(post -> {
                    Boolean before = post.getIsHidden();
                    post.setIsHidden(hidden);
                    post.setUpdatedAt(LocalDateTime.now());
                    return forumPostRepository.save(post)
                            .flatMap(saved -> createAuditLog(adminUserId, post.getAuthorMemberId(),
                                    "UPDATE_POST_VISIBILITY", "FORUM_POST", String.valueOf(postId),
                                    String.valueOf(before), String.valueOf(hidden)).thenReturn(saved));
                })
                .flatMap(this::convertToPostDTO)
                .delayUntil(r -> cacheUtils.clear(CacheNames.FORUM_CATEGORY))
                .doOnSuccess(r -> log.debug("updatePostVisibility result: {}", JsonUtils.toJson(r)));
    }

    /** Allowed values for forum topic/category status. */
    private static final Set<String> FORUM_STATUSES = Set.of("PENDING", "ACTIVE", "INACTIVE");

    private static String normalizeStatus(String status) {
        String normalized = status == null ? null : status.trim().toUpperCase();
        if (normalized == null || !FORUM_STATUSES.contains(normalized)) {
            throw new ApplicationException(ErrorCode.FORUM_INVALID_STATUS);
        }
        return normalized;
    }

    public Mono<com.service.backend.forum.dto.ForumTopicDTO> updateTopicStatus(Integer topicId, String status, Integer adminUserId) {
        final String newStatus;
        try {
            newStatus = normalizeStatus(status);
        } catch (ApplicationException e) {
            return Mono.error(e);
        }
        return forumTopicRepository.findById(topicId)
                .switchIfEmpty(Mono.defer(() -> Mono.error(new ApplicationException(ErrorCode.FORUM_TOPIC_NOT_FOUND))))
                .flatMap(topic -> {
                    String before = topic.getStatus();
                    topic.setStatus(newStatus);
                    topic.setUpdatedAt(LocalDateTime.now());
                    return forumTopicRepository.save(topic)
                            .doOnSuccess(saved -> notifyTopicApprovedIfNeeded(saved, before, newStatus))
                            .flatMap(saved -> createAuditLog(adminUserId, topic.getCreatedByMemberId(),
                                    "UPDATE_TOPIC_STATUS", "FORUM_TOPIC", String.valueOf(topicId),
                                    before, newStatus).thenReturn(saved));
                })
                .flatMap(this::convertToTopicDTOWithPostCount)
                .delayUntil(r -> cacheUtils.clear(CacheNames.FORUM_CATEGORY))
                .doOnSuccess(r -> log.debug("updateTopicStatus result: {}", JsonUtils.toJson(r)));
    }

    private void notifyTopicApprovedIfNeeded(ForumTopic topic, String beforeStatus, String newStatus) {
        if (!Status.PENDING.name().equals(beforeStatus) || !Status.ACTIVE.name().equals(newStatus)) {
            return;
        }
        if (topic.getCreatedByMemberId() == null) {
            return;
        }
        notificationService.createNotificationAsync(
                topic.getCreatedByMemberId(),
                "Chủ đề diễn đàn đã được duyệt",
                "Chủ đề \"" + topic.getTitle() + "\" đã được duyệt và đang hiển thị trên diễn đàn.",
                "/forum/topic/" + topic.getId());
    }

    public Mono<ForumCategoryDTO> updateCategoryStatus(Integer categoryId, String status, Integer adminUserId) {
        final String newStatus;
        try {
            newStatus = normalizeStatus(status);
        } catch (ApplicationException e) {
            return Mono.error(e);
        }
        return forumCategoryRepository.findById(categoryId)
                .switchIfEmpty(Mono.defer(() -> Mono.error(new ApplicationException(ErrorCode.FORUM_CATEGORY_NOT_FOUND))))
                .flatMap(category -> {
                    String before = category.getStatus();
                    category.setStatus(newStatus);
                    category.setUpdatedAt(LocalDateTime.now());
                    return forumCategoryRepository.save(category)
                            .flatMap(saved -> createAuditLog(adminUserId, null,
                                    "UPDATE_CATEGORY_STATUS", "FORUM_CATEGORY", String.valueOf(categoryId),
                                    before, newStatus).thenReturn(saved));
                })
                .map(this::convertToCategoryDTO)
                .delayUntil(r -> cacheUtils.clear(CacheNames.FORUM_CATEGORY))
                .doOnSuccess(r -> log.debug("updateCategoryStatus result: {}", JsonUtils.toJson(r)));
    }

    // ========== DELETE TOPIC ==========

    @Transactional
    public Mono<Void> deleteForumTopic(Integer topicId) {
        return forumTopicRepository.findById(topicId)
                .switchIfEmpty(Mono.defer(() -> Mono.error(new ApplicationException(ErrorCode.FORUM_TOPIC_NOT_FOUND))))
                .flatMap(topic -> cascadeDeleteTopic(topicId))
                .then(cacheUtils.clear(CacheNames.FORUM_CATEGORY))
                .doOnSuccess(v -> log.info("deleteForumTopic: topicId={} deleted", topicId))
                .doOnError(error -> log.error("Error deleting forum topic ID: {}", topicId, error));
    }

    /**
     * Hard-delete a topic and everything that references it, respecting FK order:
     * reactions and reports (which reference posts) -> subscriptions (reference topic)
     * -> posts -> topic.
     */
    private Mono<Void> cascadeDeleteTopic(Integer topicId) {
        return forumPostReactionRepository.deleteByTopicId(topicId)
                .then(forumPostReportRepository.deleteByTopicId(topicId))
                .then(forumTopicSubscriptionRepository.deleteByTopicId(topicId))
                .then(forumPostRepository.deleteByTopicId(topicId))
                .then(forumTopicRepository.deleteById(topicId));
    }

    // ========== CATEGORY MANAGEMENT ==========

    public Flux<ForumCategoryDTO> getAllCategoriesByOrganization(Integer organizationId) {
        return forumCategoryRepository.findByOrganizationId(organizationId)
                .map(this::convertToCategoryDTO)
                .doOnError(error -> log.error("Error fetching categories for organization ID: {}", organizationId, error));
    }

    public Mono<ForumCategoryDTO> getCategoryById(Integer categoryId) {
        return forumCategoryRepository.findById(categoryId)
                .switchIfEmpty(Mono.defer(() -> Mono.error(new ApplicationException(ErrorCode.FORUM_CATEGORY_NOT_FOUND))))
                .map(this::convertToCategoryDTO)
                .doOnSuccess(r -> log.debug("getCategoryById result: {}", JsonUtils.toJson(r)))
                .doOnError(error -> log.error("Error fetching category ID: {}", categoryId, error));
    }

    public Mono<ForumCategoryDTO> createCategory(
            Integer organizationId, String name, String description, Integer parentId) {
        return validateCategoryParent(organizationId, null, parentId)
                .then(Mono.defer(() -> {
                    ForumCategory category =
                        ForumCategory.builder()
                            .parentId(parentId)
                            .organizationId(organizationId)
                            .name(name)
                            .description(description)
                            .status(Status.ACTIVE.name())
                            .createdAt(java.time.LocalDateTime.now())
                            .updatedAt(java.time.LocalDateTime.now())
                            .build();

                    return forumCategoryRepository.save(category);
                }))
                .map(this::convertToCategoryDTO)
                .delayUntil(r -> cacheUtils.clear(CacheNames.FORUM_CATEGORY))
                .doOnSuccess(result -> log.debug("createCategory result: {}", JsonUtils.toJson(result)))
                .doOnError(error -> log.error("Error creating forum category: {}", name, error));
    }

    public Mono<ForumCategoryDTO> updateCategory(
            Integer categoryId, String name, String description, Integer parentId) {
        return forumCategoryRepository.findById(categoryId)
                .switchIfEmpty(Mono.defer(() -> Mono.error(new ApplicationException(ErrorCode.FORUM_CATEGORY_NOT_FOUND))))
                .flatMap(category -> validateCategoryParent(category.getOrganizationId(), categoryId, parentId)
                        .then(Mono.defer(() -> {
                    if (name != null) category.setName(name);
                    if (description != null) category.setDescription(description);
                    if (parentId != null) category.setParentId(parentId);
                    category.setUpdatedAt(java.time.LocalDateTime.now());
                    return forumCategoryRepository.save(category);
                })))
                .map(this::convertToCategoryDTO)
                .delayUntil(r -> cacheUtils.clear(CacheNames.FORUM_CATEGORY))
                .doOnSuccess(result -> log.debug("updateCategory result: {}", JsonUtils.toJson(result)))
                .doOnError(error -> log.error("Error updating category ID: {}", categoryId, error));
    }

    private Mono<Void> validateCategoryParent(Integer organizationId, Integer categoryId, Integer parentId) {
        if (parentId == null) {
            return Mono.<Void>empty();
        }
        if (categoryId != null && parentId.equals(categoryId)) {
            return Mono.error(new ApplicationException(
                    ErrorCode.BAD_REQUEST,
                    "Danh mục không thể chọn chính nó làm danh mục cha"));
        }
        Mono<Void> parentIsRoot = forumCategoryRepository.findById(parentId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.FORUM_CATEGORY_NOT_FOUND)))
                .flatMap(parent -> {
                    if (organizationId != null && !organizationId.equals(parent.getOrganizationId())) {
                        return Mono.error(new ApplicationException(
                                ErrorCode.BAD_REQUEST,
                                "Danh mục cha không thuộc tổ chức hiện tại"));
                    }
                    if (parent.getParentId() != null) {
                        return Mono.error(new ApplicationException(
                                ErrorCode.BAD_REQUEST,
                                "Chỉ danh mục cấp 1 mới có thể được chọn làm danh mục cha"));
                    }
                    return Mono.<Void>empty();
                });

        if (categoryId == null) {
            return parentIsRoot;
        }

        return parentIsRoot.then(
                forumCategoryRepository.findByParentId(categoryId)
                        .hasElements()
                        .flatMap(hasChildren -> Boolean.TRUE.equals(hasChildren)
                                ? Mono.error(new ApplicationException(
                                        ErrorCode.BAD_REQUEST,
                                        "Diễn đàn chỉ hỗ trợ 2 cấp danh mục"))
                                : Mono.<Void>empty()));
    }

    /**
     * Force-delete a category and everything inside it: recursively delete child categories,
     * then cascade-delete every topic under the category (and each topic's posts/reactions/
     * reports/subscriptions), then the category itself.
     */
    @Transactional
    public Mono<Void> deleteCategory(Integer categoryId) {
        return forumCategoryRepository.findById(categoryId)
                .switchIfEmpty(Mono.defer(() -> Mono.error(new ApplicationException(ErrorCode.FORUM_CATEGORY_NOT_FOUND))))
                .flatMap(category -> cascadeDeleteCategory(categoryId))
                .then(cacheUtils.clear(CacheNames.FORUM_CATEGORY))
                .doOnSuccess(v -> log.info("deleteCategory: categoryId={} deleted (cascade)", categoryId))
                .doOnError(error -> log.error("Error deleting category ID: {}", categoryId, error));
    }

    private Mono<Void> cascadeDeleteCategory(Integer categoryId) {
        Mono<Void> deleteChildren = forumCategoryRepository.findByParentId(categoryId)
                .map(ForumCategory::getId)
                .filter(Objects::nonNull)
                .concatMap(this::cascadeDeleteCategory)
                .then();
        Mono<Void> deleteTopics = forumTopicRepository.findByCategoryId(categoryId)
                .map(ForumTopic::getId)
                .filter(Objects::nonNull)
                .concatMap(this::cascadeDeleteTopic)
                .then();
        return deleteChildren
                .then(deleteTopics)
                .then(forumCategoryRepository.deleteById(categoryId));
    }

    // ========== TOPIC MANAGEMENT ==========

    public Mono<PaginatedResponse<com.service.backend.forum.dto.ForumTopicDTO>> getAllTopicsByOrganization(
            Integer organizationId, String keyword, int page, int size) {
        long offset = (long) page * size;
        String kw = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        if (organizationId != null) {
            return PaginationHelper.paginate(
                        forumTopicRepository.findByOrganizationIdWithPagination(organizationId, kw, size, offset)
                                .concatMap(this::convertToTopicDTOWithPostCount),
                        forumTopicRepository.countByOrganizationId(organizationId, kw),
                        page, size)
                    .doOnSuccess(r -> log.debug("getAllTopicsByOrganization result (orgId={}, keyword={}): {}", organizationId, kw, JsonUtils.toJson(r)))
                    .doOnError(error -> log.error("Error fetching topics for organization ID: {} keyword={}", organizationId, kw, error));
        }
        return PaginationHelper.paginate(
                    forumTopicRepository.findAllWithPagination(kw, size, offset)
                            .concatMap(this::convertToTopicDTOWithPostCount),
                    forumTopicRepository.countAll(kw),
                    page, size)
                .doOnSuccess(r -> log.debug("getAllTopicsByOrganization (all orgs, keyword={}): {}", kw, JsonUtils.toJson(r)))
                .doOnError(error -> log.error("Error fetching all topics keyword={}", kw, error));
    }

    public Mono<com.service.backend.forum.dto.ForumTopicDTO> getTopicById(Integer topicId) {
        return forumTopicRepository.findById(topicId)
                .switchIfEmpty(Mono.defer(() -> Mono.error(new ApplicationException(ErrorCode.FORUM_TOPIC_NOT_FOUND))))
                .flatMap(this::convertToTopicDTOWithPostCount)
                .doOnSuccess(r -> log.debug("getTopicById result: {}", JsonUtils.toJson(r)))
                .doOnError(error -> log.error("Error fetching topic ID: {}", topicId, error));
    }

    public Mono<com.service.backend.forum.dto.ForumTopicDTO> createTopic(
            Integer organizationId, Integer categoryId, String title, Integer createdByMemberId) {
        return forumCategoryRepository.findById(categoryId)
                .switchIfEmpty(Mono.defer(() -> Mono.error(new ApplicationException(ErrorCode.FORUM_CATEGORY_NOT_FOUND))))
                .flatMap(category -> {
                    ForumTopic topic =
                            ForumTopic.builder()
                                    .organizationId(organizationId)
                                    .categoryId(categoryId)
                                    .title(title)
                                    .createdByMemberId(createdByMemberId)
                                    .viewCount(0)
                                    // Admin-created topics are published immediately.
                                    .status(Status.ACTIVE.name())
                                    .createdAt(java.time.LocalDateTime.now())
                                    .updatedAt(java.time.LocalDateTime.now())
                                    .build();
                    return forumTopicRepository.save(topic);
                })
                .flatMap(this::convertToTopicDTOWithPostCount)
                .delayUntil(r -> cacheUtils.clear(CacheNames.FORUM_CATEGORY))
                .doOnSuccess(result -> log.debug("createTopic result: {}", JsonUtils.toJson(result)))
                .doOnError(error -> log.error("Error creating forum topic: {}", title, error));
    }

    public Mono<com.service.backend.forum.dto.ForumTopicDTO> updateTopic(
            Integer topicId, String title, Integer categoryId) {
        return forumTopicRepository.findById(topicId)
                .switchIfEmpty(Mono.defer(() -> Mono.error(new ApplicationException(ErrorCode.FORUM_TOPIC_NOT_FOUND))))
                .flatMap(topic -> {
                    if (title != null) topic.setTitle(title);
                    if (categoryId != null) topic.setCategoryId(categoryId);
                    topic.setUpdatedAt(java.time.LocalDateTime.now());
                    return forumTopicRepository.save(topic);
                })
                .flatMap(this::convertToTopicDTOWithPostCount)
                .delayUntil(r -> cacheUtils.clear(CacheNames.FORUM_CATEGORY))
                .doOnSuccess(result -> log.debug("updateTopic result: {}", JsonUtils.toJson(result)))
                .doOnError(error -> log.error("Error updating topic ID: {}", topicId, error));
    }

    // ========== FORUM STATISTICS ==========

    public Mono<ForumStatisticsDTO> getForumStatistics() {
        Mono<Long> totalCategoriesMono = forumCategoryRepository.count();

        Mono<ForumStatisticsDTO> baseMono = Mono.zip(
                forumPostRepository.getAggregatedPostStats(),
                forumTopicRepository.getAggregatedTopicStats(),
                totalCategoriesMono
        ).map(tuple -> {
            var postStats = tuple.getT1();
            var topicStats = tuple.getT2();
            var totalCategories = tuple.getT3();
            return ForumStatisticsDTO.builder()
                .totalPosts(postStats.getTotalPosts() != null ? postStats.getTotalPosts() : 0L)
                .bannedPosts(postStats.getBannedPosts() != null ? postStats.getBannedPosts() : 0L)
                .newPostsToday(postStats.getNewPostsToday() != null ? postStats.getNewPostsToday() : 0L)
                .totalTopics(topicStats.getTotalTopics() != null ? topicStats.getTotalTopics() : 0L)
                .newTopicsToday(topicStats.getNewTopicsToday() != null ? topicStats.getNewTopicsToday() : 0L)
                .totalCategories(totalCategories)
                .build();
        });

        Mono<ForumStatisticsDTO.TopicSummary> popularTopicMono = forumPostRepository.findTopicIdWithMostPosts()
                .flatMap(topicId -> forumTopicRepository.findById(topicId)
                        .zipWith(forumPostRepository.countByTopicIdAndIsBannedFalse(topicId))
                        .map(tuple -> ForumStatisticsDTO.TopicSummary.builder()
                                .topicId(tuple.getT1().getId())
                                .title(tuple.getT1().getTitle())
                                .categoryId(tuple.getT1().getCategoryId())
                                .postCount(tuple.getT2())
                                .viewCount(tuple.getT1().getViewCount())
                                .createdAt(tuple.getT1().getCreatedAt())
                                .build()))
                .defaultIfEmpty(ForumStatisticsDTO.TopicSummary.builder().build());

        Mono<ForumStatisticsDTO.CategorySummary> popularCategoryMono = forumTopicRepository.findCategoryIdWithMostPosts()
                .flatMap(categoryId -> forumCategoryRepository.findById(categoryId)
                        .zipWith(forumTopicRepository.countByCategoryId(categoryId, null))
                        .zipWith(forumPostRepository.countPostsByCategoryId(categoryId))
                        .map(tuple -> ForumStatisticsDTO.CategorySummary.builder()
                                .categoryId(tuple.getT1().getT1().getId())
                                .categoryName(tuple.getT1().getT1().getName())
                                .topicCount(tuple.getT1().getT2())
                                .postCount(tuple.getT2())
                                .build()))
                .defaultIfEmpty(ForumStatisticsDTO.CategorySummary.builder().build());

        Mono<List<ForumStatisticsDTO.GhostTopicSummary>> ghostTopicsMono = forumTopicRepository.findGhostTopics()
                .collectList()
                .flatMap(topics -> {
                    if (topics.isEmpty()) return Mono.just(Collections.<ForumStatisticsDTO.GhostTopicSummary>emptyList());

                    Set<Integer> categoryIds = topics.stream()
                            .map(ForumTopic::getCategoryId)
                            .filter(Objects::nonNull)
                            .collect(Collectors.toSet());

                    Mono<Map<Integer, String>> categoryNamesMono = categoryIds.isEmpty()
                            ? Mono.just(Map.of())
                            : forumCategoryRepository.findAllById(categoryIds)
                                    .collectMap(ForumCategory::getId, ForumCategory::getName);

                    return categoryNamesMono.map(nameMap -> topics.stream()
                            .map(topic -> {
                                String catName = topic.getCategoryId() == null
                                        ? "Uncategorized"
                                        : nameMap.getOrDefault(topic.getCategoryId(), "Unknown");
                                return ForumStatisticsDTO.GhostTopicSummary.builder()
                                        .topicId(topic.getId())
                                        .title(topic.getTitle())
                                        .categoryName(catName)
                                        .viewCount(topic.getViewCount())
                                        .createdAt(topic.getCreatedAt())
                                        .build();
                            })
                            .collect(Collectors.toList()));
                })
                .defaultIfEmpty(Collections.emptyList());

        return Mono.zip(baseMono, popularTopicMono, popularCategoryMono, ghostTopicsMono)
                .map(tuple -> {
                    ForumStatisticsDTO stats = tuple.getT1();
                    stats.setMostPopularTopic(tuple.getT2());
                    stats.setMostPopularCategory(tuple.getT3());
                    stats.setGhostTopics(tuple.getT4());
                    return stats;
                })
                .doOnSuccess(result -> log.debug("getForumStatistics result: {}", JsonUtils.toJson(result)))
                .doOnError(error -> log.error("Error fetching forum statistics", error));
    }

    // ========== TOP CONTRIBUTORS ==========

    public Mono<List<TopContributorDTO>> getTopContributors(int month, int year) {
        return forumPostRepository.findTopContributorMemberIds(month, year)
                .collectList()
                .flatMap(memberIds -> {
                    if (memberIds.isEmpty()) return Mono.just(Collections.<TopContributorDTO>emptyList());

                    // Batch-load users and per-author counts instead of two queries per contributor.
                    Mono<Map<Integer, com.service.backend.shared.entity.User>> usersMapMono =
                            adminUserRepository.findAllById(memberIds)
                                    .collectMap(com.service.backend.shared.entity.User::getId);
                    Mono<Map<Integer, Long>> countsMapMono =
                            forumPostRepository.countPostsByAuthorsInMonth(memberIds, month, year)
                                    .collectMap(IdCountDTO::getId, IdCountDTO::getCount);

                    return Mono.zip(usersMapMono, countsMapMono)
                            .map(tuple -> {
                                Map<Integer, com.service.backend.shared.entity.User> users = tuple.getT1();
                                Map<Integer, Long> counts = tuple.getT2();
                                List<TopContributorDTO> result = new ArrayList<>();
                                for (Integer memberId : memberIds) {
                                    com.service.backend.shared.entity.User user = users.get(memberId);
                                    Long count = counts.get(memberId);
                                    // Preserve original zipWith semantics: skip when user or count is absent.
                                    if (user == null || count == null) continue;
                                    result.add(TopContributorDTO.builder()
                                            .memberId(memberId)
                                            .email(user.getEmail())
                                            .avatarUrl(user.getAvatarUrl())
                                            .postCount(count)
                                            .build());
                                }
                                return result;
                            });
                })
                .defaultIfEmpty(Collections.emptyList())
                .doOnSuccess(result -> log.debug("getTopContributors result: {}", JsonUtils.toJson(result)))
                .doOnError(error -> log.error("Error fetching top contributors for {}/{}", month, year, error));
    }

    // ========== ORGANIZATION ENGAGEMENT RATE ==========

    public Mono<List<OrganizationEngagementDTO>> getOrganizationEngagement() {
        return organizationRepository.findAll()
                .collectList()
                .flatMap(orgs -> {
                    if (orgs.isEmpty()) return Mono.just(Collections.<OrganizationEngagementDTO>emptyList());

                    Set<Integer> orgIds = orgs.stream()
                            .map(Organization::getId)
                            .filter(Objects::nonNull)
                            .collect(Collectors.toSet());

                    // Two batch queries instead of two count queries per organization.
                    Mono<Map<Integer, Long>> totalMembersMapMono =
                            organizationRepository.countActiveMembersByOrganizations(orgIds)
                                    .collectMap(IdCountDTO::getId, IdCountDTO::getCount);
                    Mono<Map<Integer, Long>> activeForumUsersMapMono =
                            forumPostRepository.countActiveForumUsersByOrganizations(orgIds)
                                    .collectMap(IdCountDTO::getId, IdCountDTO::getCount);

                    return Mono.zip(totalMembersMapMono, activeForumUsersMapMono)
                            .map(tuple -> {
                                Map<Integer, Long> totalMembers = tuple.getT1();
                                Map<Integer, Long> activeForumUsers = tuple.getT2();
                                return orgs.stream()
                                        .map(org -> OrganizationEngagementDTO.builder()
                                                .organizationId(org.getId())
                                                .organizationName(org.getName())
                                                .totalMembers(totalMembers.getOrDefault(org.getId(), 0L))
                                                .activeForumUsers(activeForumUsers.getOrDefault(org.getId(), 0L))
                                                .build())
                                        .collect(Collectors.toList());
                            });
                })
                .defaultIfEmpty(Collections.emptyList())
                .doOnSuccess(result -> log.debug("getOrganizationEngagement result: {}", JsonUtils.toJson(result)))
                .doOnError(error -> log.error("Error fetching organization engagement rates", error));
    }

    // ========== MONTHLY ACTIVITY TIMELINE ==========

    public Mono<MonthlyActivityDTO> getMonthlyActivityTimeline(int year) {
        List<Mono<MonthlyActivityDTO.MonthData>> monthMonos = new ArrayList<>();

        for (int m = 1; m <= 12; m++) {
            final int month = m;
            Mono<MonthlyActivityDTO.MonthData> monthMono = Mono.zip(
                    forumPostRepository.countDistinctActiveUsersInMonth(month, year).defaultIfEmpty(0L),
                    forumPostRepository.countPostsInMonth(month, year).defaultIfEmpty(0L),
                    forumTopicRepository.countTopicsInMonth(month, year).defaultIfEmpty(0L)
            ).map(tuple -> MonthlyActivityDTO.MonthData.builder()
                    .month(month)
                    .activeUsers(tuple.getT1())
                    .postCount(tuple.getT2())
                    .topicCount(tuple.getT3())
                    .build());

            monthMonos.add(monthMono);
        }

        // Cap concurrency so the 12 months (×3 count queries each) don't all hit the pool at once;
        // mergeSequential still emits results in month order, so the output is unchanged.
        return Flux.mergeSequential(monthMonos, 4, 1)
                .collectList()
                .map(months -> MonthlyActivityDTO.builder()
                        .year(year)
                        .months(months)
                        .build())
                .doOnSuccess(result -> log.debug("getMonthlyActivityTimeline result: {}", JsonUtils.toJson(result)))
                .doOnError(error -> log.error("Error fetching monthly activity timeline for year: {}", year, error));
    }

    // ========== HELPER METHODS ==========

    private Flux<ForumPostDTO> enrichPosts(Flux<ForumPost> postsFlux) {
        return postsFlux.collectList().flatMapMany(posts -> {
            if (posts.isEmpty()) return Flux.empty();
            Set<Integer> topicIds = posts.stream().map(ForumPost::getTopicId).filter(Objects::nonNull).collect(Collectors.toSet());
            Set<Integer> postIds = posts.stream().map(ForumPost::getId).filter(Objects::nonNull).collect(Collectors.toSet());
            Set<Integer> authorIds = posts.stream().map(ForumPost::getAuthorMemberId).filter(Objects::nonNull).collect(Collectors.toSet());
            Set<Integer> categoryIds = new HashSet<>();

            Mono<Map<Integer, ForumTopic>> topicsMapMono = topicIds.isEmpty() ? Mono.just(new HashMap<>()) :
                    forumTopicRepository.findAllById(topicIds).collectMap(ForumTopic::getId);

            Mono<Map<Integer, Long>> flagsCountMapMono = postIds.isEmpty() ? Mono.just(new HashMap<>()) :
                    forumPostReportRepository.countByPostIds(postIds).collectMap(IdCountDTO::getId, IdCountDTO::getCount);

            Mono<Map<Integer, UserDisplayInfo>> authorsMapMono = authorIds.isEmpty() ? Mono.just(new HashMap<>()) :
                    userProfileRepository.findByUserIds(authorIds);

            return topicsMapMono.flatMapMany(topicsMap -> {
                for (ForumTopic topic : topicsMap.values()) {
                    if (topic.getCategoryId() != null) categoryIds.add(topic.getCategoryId());
                }
                Mono<Map<Integer, ForumCategory>> categoriesMapMono = categoryIds.isEmpty() ? Mono.just(new HashMap<>()) :
                        forumCategoryRepository.findAllById(categoryIds).collectMap(ForumCategory::getId);

                return categoriesMapMono.flatMapMany(categoriesMap ->
                        Mono.zip(flagsCountMapMono, authorsMapMono).flatMapMany(tuple -> Flux.fromIterable(posts).map(post -> {
                    Map<Integer, Long> flagsCountMap = tuple.getT1();
                    Map<Integer, UserDisplayInfo> authorsMap = tuple.getT2();
                    ForumTopic topic = topicsMap.getOrDefault(post.getTopicId(), ForumTopic.builder().build());
                    ForumCategory category = categoriesMap.getOrDefault(topic.getCategoryId(), ForumCategory.builder().build());
                    Long flagsCount = flagsCountMap.getOrDefault(post.getId(), 0L);
                    UserDisplayInfo author = post.getAuthorMemberId() != null ? authorsMap.get(post.getAuthorMemberId()) : null;

                    return ForumPostDTO.builder()
                            .id(post.getId())
                            .topicId(post.getTopicId())
                            .authorMemberId(post.getAuthorMemberId())
                            .authorName(author != null ? author.getFullName() : null)
                            .authorAvatarUrl(author != null ? author.getAvatarUrl() : null)
                            .topicTitle(topic.getTitle())
                            .categoryName(category.getName())
                            .flagsCount(flagsCount)
                            .content(post.getContent())
                            .answerToPostId(post.getAnswerToPostId())
                            .isBanned(post.getIsBanned())
                            .isHidden(post.getIsHidden())
                            .isLike(false)
                            .createdAt(post.getCreatedAt())
                            .updatedAt(post.getUpdatedAt())
                            .build();
                })));
            });
        });
    }

    private Mono<ForumPostDTO> convertToPostDTO(ForumPost post) {
        return enrichPosts(Flux.just(post)).next();
    }

    private ForumPostReportDTO convertToReportDTO(ForumPostReport report) {
        return ForumPostReportDTO.builder()
                .id(report.getId())
                .postId(report.getPostId())
                .reporterMemberId(report.getReporterMemberId())
                .reason(report.getReason())
                .status(report.getStatus())
                .reviewedByUserId(report.getReviewedByUserId())
                .reviewNote(report.getReviewNote())
                .createdAt(report.getCreatedAt())
                .updatedAt(report.getUpdatedAt())
                .build();
    }

    private Mono<Void> applyModerationAction(ForumPostReport report, ReviewForumReportRequest request, Integer adminUserId) {
        if (request.getAction() == null || request.getAction().isBlank()) {
            return Mono.empty();
        }
        String action = request.getAction().toUpperCase();
        if ("WARN".equals(action)) {
            return forumPostRepository.findById(report.getPostId())
                    .switchIfEmpty(Mono.defer(() -> Mono.error(new ApplicationException(ErrorCode.FORUM_POST_NOT_FOUND))))
                    .flatMap(post -> {
                        notificationService.createNotificationAsync(
                                post.getAuthorMemberId(),
                                "Cảnh cáo vi phạm nội dung",
                                "Bài viết của bạn đã bị cảnh cáo do vi phạm quy định cộng đồng. Vui lòng tuân thủ nội quy để tránh bị xử lý nặng hơn.",
                                null);
                        return createAuditLog(adminUserId, post.getAuthorMemberId(), "WARN_USER", "FORUM_REPORT",
                                String.valueOf(report.getId()), null, null);
                    });
        }
        return forumPostRepository.findById(report.getPostId())
                .switchIfEmpty(Mono.defer(() -> Mono.error(new ApplicationException(ErrorCode.FORUM_POST_NOT_FOUND))))
                .flatMap(post -> {
                    if ("HIDE_POST".equals(action)) {
                        post.setIsHidden(true);
                        notificationService.createNotificationAsync(
                                post.getAuthorMemberId(),
                                "Bài viết đã bị ẩn",
                                "Bài viết của bạn đã bị ẩn do vi phạm quy định cộng đồng. Nội dung sẽ không hiển thị với người dùng khác.",
                                null);
                    } else if ("BAN_POST".equals(action)) {
                        post.setIsBanned(true);
                        notificationService.createNotificationAsync(
                                post.getAuthorMemberId(),
                                "Bài viết đã bị cấm",
                                "Bài viết của bạn đã bị cấm vĩnh viễn do vi phạm nghiêm trọng quy định cộng đồng.",
                                null);
                    }
                    post.setUpdatedAt(LocalDateTime.now());
                    return forumPostRepository.save(post)
                            .flatMap(saved -> createAuditLog(adminUserId, post.getAuthorMemberId(),
                                    action, "FORUM_POST", String.valueOf(saved.getId()), null, null));
                });
    }

    private Mono<Void> createAuditLog(
            Integer adminUserId,
            Integer targetUserId,
            String action,
            String resourceType,
            String resourceId,
            String beforeData,
            String afterData) {
        return adminAuditService.recordSemantic(
                adminUserId, targetUserId, action, resourceType, resourceId, beforeData, afterData, null);
    }

    private ForumCategoryDTO convertToCategoryDTO(
            ForumCategory category) {
        return ForumCategoryDTO.builder()
                .id(category.getId())
                .parentId(category.getParentId())
                .organizationId(category.getOrganizationId())
                .name(category.getName())
                .description(category.getDescription())
                .status(category.getStatus())
                .createdAt(category.getCreatedAt())
                .updatedAt(category.getUpdatedAt())
                .build();
    }

    private Flux<ForumTopicDTO> enrichTopics(Flux<ForumTopic> topicsFlux) {
        return topicsFlux.collectList().flatMapMany(topics -> {
            if (topics.isEmpty()) return Flux.empty();
            Set<Integer> topicIds = topics.stream().map(ForumTopic::getId).filter(Objects::nonNull).collect(Collectors.toSet());
            
            Mono<Map<Integer, Long>> postCountMapMono = topicIds.isEmpty() ? Mono.just(new HashMap<>()) :
                    forumPostRepository.countByTopicIds(topicIds).collectMap(IdCountDTO::getId, IdCountDTO::getCount);

            return postCountMapMono.flatMapMany(postCountMap -> Flux.fromIterable(topics).map(topic -> {
                Long postCount = postCountMap.getOrDefault(topic.getId(), 0L);
                return convertToTopicDTO(topic, postCount);
            }));
        });
    }

    private Mono<com.service.backend.forum.dto.ForumTopicDTO> convertToTopicDTOWithPostCount(
            ForumTopic topic) {
        return enrichTopics(Flux.just(topic)).next();
    }

    private com.service.backend.forum.dto.ForumTopicDTO convertToTopicDTO(
            ForumTopic topic,
            Long postCount) {
        return com.service.backend.forum.dto.ForumTopicDTO.builder()
                .id(topic.getId())
                .organizationId(topic.getOrganizationId())
                .title(topic.getTitle())
                .createdByMemberId(topic.getCreatedByMemberId())
                .categoryId(topic.getCategoryId())
                .viewCount(topic.getViewCount())
                .status(topic.getStatus())
                .postCount(postCount)
                .createdAt(topic.getCreatedAt())
                .updatedAt(topic.getUpdatedAt())
                .build();
    }
}
