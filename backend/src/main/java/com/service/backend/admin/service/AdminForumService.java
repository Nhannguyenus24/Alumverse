package com.service.backend.admin.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import com.service.backend.admin.dao.AdminAuditLogRepository;
import com.service.backend.admin.dao.AdminOrganizationRepository;
import com.service.backend.admin.dao.AdminUserRepository;
import com.service.backend.admin.dto.ForumStatisticsDTO;
import com.service.backend.admin.dto.MonthlyActivityDTO;
import com.service.backend.admin.dto.OrganizationEngagementDTO;
import com.service.backend.admin.dto.ReviewForumReportRequest;
import com.service.backend.admin.dto.TopContributorDTO;
import com.service.backend.forum.dao.ForumCategoryRepository;
import com.service.backend.forum.dao.ForumPostReportRepository;
import com.service.backend.forum.dao.ForumPostRepository;
import com.service.backend.forum.dao.ForumTopicRepository;
import com.service.backend.forum.dto.ForumPostDTO;
import com.service.backend.forum.dto.ForumPostReportDTO;
import com.service.backend.forum.entity.ForumCategory;
import com.service.backend.forum.entity.ForumPost;
import com.service.backend.forum.entity.ForumPostReport;
import com.service.backend.shared.constants.ErrorCode;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.exception.ApplicationException;
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
    private final ForumTopicRepository forumTopicRepository;
    private final ForumCategoryRepository forumCategoryRepository;
    private final ForumPostReportRepository forumPostReportRepository;
    private final AdminOrganizationRepository adminOrganizationRepository;
    private final AdminUserRepository adminUserRepository;
    private final AdminAuditLogRepository adminAuditLogRepository;

    // ========== VIEW NEW POSTS ==========

    /**
     * Get all forum posts created yesterday
     */
    public Flux<ForumPostDTO> getNewForumPostsYesterday() {
        log.info("Fetching all forum posts created yesterday");
        return forumPostRepository.findPostsCreatedYesterday()
                .concatMap(this::convertToPostDTO)
                .doOnError(error -> log.error("Error fetching forum posts created yesterday", error));
    }

    /**
     * Get forum posts created yesterday with pagination
     */
    public Mono<PaginatedResponse<ForumPostDTO>> getNewForumPostsYesterdayWithPagination(int page, int size) {
        long offset = (long) page * size;
        log.info("Fetching paginated forum posts created yesterday - page: {}, size: {}", page, size);
        
        return forumPostRepository.findPostsCreatedYesterdayWithPagination(size, offset)
                .concatMap(this::convertToPostDTO)
                .collectList()
                .zipWith(forumPostRepository.countPostsCreatedYesterday())
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, size))
                .doOnError(error -> log.error("Error fetching paginated forum posts created yesterday", error));
    }

    // ========== BAN/UNBAN POST ==========

    /**
     * Ban a forum post
     */
    public Mono<ForumPostDTO> banForumPost(Integer postId) {
        log.info("Banning forum post ID: {}", postId);
        return SecurityUtils.getCurrentUserId()
                .flatMap(adminId -> forumPostRepository.findById(postId)
                        .switchIfEmpty(Mono.defer(() -> Mono.error(new ApplicationException(ErrorCode.FORUM_POST_NOT_FOUND))))
                        .flatMap(post -> {
                            post.setIsBanned(true);
                            return forumPostRepository.save(post)
                                    .flatMap(saved -> createAuditLog(adminId.intValue(), post.getAuthorMemberId(),
                                            "BAN_POST", "FORUM_POST", String.valueOf(postId), null, null)
                                            .thenReturn(saved));
                        }))
                .flatMap(this::convertToPostDTO)
                .doOnSuccess(result -> log.info("Successfully banned forum post ID: {}", postId))
                .doOnError(error -> log.error("Error banning forum post ID: {}", postId, error));
    }

    /**
     * Unban a forum post
     */
    public Mono<ForumPostDTO> unbanForumPost(Integer postId) {
        log.info("Unbanning forum post ID: {}", postId);
        return SecurityUtils.getCurrentUserId()
                .flatMap(adminId -> forumPostRepository.findById(postId)
                        .switchIfEmpty(Mono.defer(() -> Mono.error(new ApplicationException(ErrorCode.FORUM_POST_NOT_FOUND))))
                        .flatMap(post -> {
                            post.setIsBanned(false);
                            return forumPostRepository.save(post)
                                    .flatMap(saved -> createAuditLog(adminId.intValue(), post.getAuthorMemberId(),
                                            "UNBAN_POST", "FORUM_POST", String.valueOf(postId), null, null)
                                            .thenReturn(saved));
                        }))
                .flatMap(this::convertToPostDTO)
                .doOnSuccess(result -> log.info("Successfully unbanned forum post ID: {}", postId))
                .doOnError(error -> log.error("Error unbanning forum post ID: {}", postId, error));
    }

    /**
     * Delete a forum post
     */
    public Mono<Void> deleteForumPost(Integer postId) {
        log.info("Deleting forum post ID: {}", postId);
        return forumPostRepository.findById(postId)
                .switchIfEmpty(Mono.defer(() -> Mono.error(new ApplicationException(ErrorCode.FORUM_POST_NOT_FOUND))))
                .flatMap(post -> forumPostRepository.deleteById(postId))
                .doOnSuccess(v -> log.info("Successfully deleted forum post ID: {}", postId))
                .doOnError(error -> log.error("Error deleting forum post ID: {}", postId, error));
    }

    /**
     * Get all banned forum posts with pagination
     */
    public Mono<PaginatedResponse<ForumPostDTO>> getBannedPostsWithPagination(int page, int size) {
        log.info("Fetching banned forum posts - page: {}, size: {}", page, size);
        long offset = (long) page * size;
        
        return forumPostRepository.findAllBannedPostsWithPagination(size, offset)
                .concatMap(this::convertToPostDTO)
                .collectList()
                .zipWith(forumPostRepository.countByIsBannedTrue())
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, size))
                .doOnError(error -> log.error("Error fetching banned forum posts", error));
    }

    /**
     * Get all forum posts with pagination (admin moderation).
     */
    public Mono<PaginatedResponse<ForumPostDTO>> getAllPostsWithPagination(int page, int size) {
        log.info("Fetching all forum posts - page: {}, size: {}", page, size);
        long offset = (long) page * size;

        return forumPostRepository.findAllPostsWithPagination(size, offset)
                .concatMap(this::convertToPostDTO)
                .collectList()
                .zipWith(forumPostRepository.count())
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, size))
                .doOnError(error -> log.error("Error fetching all forum posts", error));
    }

    public Mono<PaginatedResponse<ForumPostReportDTO>> getPendingReports(int page, int size) {
        long offset = (long) page * size;
        return forumPostReportRepository.findByStatusWithPagination("PENDING", size, offset)
                .map(this::convertToReportDTO)
                .collectList()
                .zipWith(forumPostReportRepository.countByStatus("PENDING"))
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, size));
    }

    public Mono<ForumPostReportDTO> reviewReport(Long reportId, ReviewForumReportRequest request, Integer adminUserId) {
        return forumPostReportRepository.findById(reportId)
                .switchIfEmpty(Mono.defer(() -> Mono.error(new ApplicationException(ErrorCode.FORUM_REPORT_NOT_FOUND))))
                .flatMap(report -> applyModerationAction(report, request, adminUserId)
                        .then(Mono.defer(() -> {
                            report.setStatus(request.getDecision().toUpperCase());
                            report.setReviewedByUserId(adminUserId);
                            report.setReviewNote(request.getReviewNote());
                            report.setUpdatedAt(LocalDateTime.now());
                            return forumPostReportRepository.save(report);
                        })))
                .map(this::convertToReportDTO);
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
                .flatMap(this::convertToPostDTO);
    }

    public Mono<com.service.backend.forum.dto.ForumTopicDTO> updateTopicLock(Integer topicId, Boolean locked, Integer adminUserId) {
        return forumTopicRepository.findById(topicId)
                .switchIfEmpty(Mono.defer(() -> Mono.error(new ApplicationException(ErrorCode.FORUM_TOPIC_NOT_FOUND))))
                .flatMap(topic -> {
                    Boolean before = topic.getIsLocked();
                    topic.setIsLocked(locked);
                    topic.setUpdatedAt(LocalDateTime.now());
                    return forumTopicRepository.save(topic)
                            .flatMap(saved -> createAuditLog(adminUserId, topic.getCreatedByMemberId(),
                                    "UPDATE_TOPIC_LOCK", "FORUM_TOPIC", String.valueOf(topicId),
                                    String.valueOf(before), String.valueOf(locked)).thenReturn(saved));
                })
                .flatMap(this::convertToTopicDTOWithPostCount);
    }

    // ========== DELETE TOPIC ==========

    /**
     * Delete a forum topic and all its posts
     */
    public Mono<Void> deleteForumTopic(Integer topicId) {
        log.info("Deleting forum topic ID: {}", topicId);
        return forumTopicRepository.findById(topicId)
                .switchIfEmpty(Mono.defer(() -> Mono.error(new ApplicationException(ErrorCode.FORUM_TOPIC_NOT_FOUND))))
                .flatMap(topic -> {
                    // Delete all posts in this topic first
                    return forumPostRepository.findByTopicId(topicId)
                            .flatMap(post -> forumPostRepository.deleteById(post.getId()))
                            .then(forumTopicRepository.deleteById(topicId));
                })
                .doOnSuccess(v -> log.info("Successfully deleted forum topic ID: {}", topicId))
                .doOnError(error -> log.error("Error deleting forum topic ID: {}", topicId, error));
    }

    // ========== CATEGORY MANAGEMENT ==========

    /**
     * Get all forum categories by organization
     */
    public Flux<com.service.backend.forum.dto.ForumCategoryDTO> getAllCategoriesByOrganization(Integer organizationId) {
        log.info("Fetching all forum categories for organization ID: {}", organizationId);
        return forumCategoryRepository.findByOrganizationId(organizationId)
                .map(this::convertToCategoryDTO)
                .doOnError(error -> log.error("Error fetching categories for organization ID: {}", organizationId, error));
    }

    /**
     * Get forum category by ID
     */
    public Mono<com.service.backend.forum.dto.ForumCategoryDTO> getCategoryById(Integer categoryId) {
        log.info("Fetching forum category ID: {}", categoryId);
        return forumCategoryRepository.findById(categoryId)
                .switchIfEmpty(Mono.defer(() -> Mono.error(new ApplicationException(ErrorCode.FORUM_CATEGORY_NOT_FOUND))))
                .map(this::convertToCategoryDTO)
                .doOnError(error -> log.error("Error fetching category ID: {}", categoryId, error));
    }

    /**
     * Create a new forum category
     */
    public Mono<com.service.backend.forum.dto.ForumCategoryDTO> createCategory(
            Integer organizationId, String name, String description, Integer parentId) {
        log.info("Creating forum category: {}", name);
        com.service.backend.forum.entity.ForumCategory category = 
            com.service.backend.forum.entity.ForumCategory.builder()
                .parentId(parentId)
                .organizationId(organizationId)
                .name(name)
                .description(description)
                .createdAt(java.time.LocalDateTime.now())
                .updatedAt(java.time.LocalDateTime.now())
                .build();
        
        return forumCategoryRepository.save(category)
                .map(this::convertToCategoryDTO)
                .doOnSuccess(result -> log.info("Successfully created forum category: {}", name))
                .doOnError(error -> log.error("Error creating forum category: {}", name, error));
    }

    /**
     * Update a forum category
     */
    public Mono<com.service.backend.forum.dto.ForumCategoryDTO> updateCategory(
            Integer categoryId, String name, String description, Integer parentId) {
        log.info("Updating forum category ID: {}", categoryId);
        return forumCategoryRepository.findById(categoryId)
                .switchIfEmpty(Mono.defer(() -> Mono.error(new ApplicationException(ErrorCode.FORUM_CATEGORY_NOT_FOUND))))
                .flatMap(category -> {
                    if (name != null) category.setName(name);
                    if (description != null) category.setDescription(description);
                    if (parentId != null) category.setParentId(parentId);
                    category.setUpdatedAt(java.time.LocalDateTime.now());
                    return forumCategoryRepository.save(category);
                })
                .map(this::convertToCategoryDTO)
                .doOnSuccess(result -> log.info("Successfully updated forum category ID: {}", categoryId))
                .doOnError(error -> log.error("Error updating category ID: {}", categoryId, error));
    }

    /**
     * Delete a forum category
     */
    public Mono<Void> deleteCategory(Integer categoryId) {
        log.info("Deleting forum category ID: {}", categoryId);
        return forumCategoryRepository.findById(categoryId)
                .switchIfEmpty(Mono.defer(() -> Mono.error(new ApplicationException(ErrorCode.FORUM_CATEGORY_NOT_FOUND))))
                .flatMap(category -> forumCategoryRepository.deleteById(categoryId))
                .doOnSuccess(v -> log.info("Successfully deleted forum category ID: {}", categoryId))
                .doOnError(error -> log.error("Error deleting category ID: {}", categoryId, error));
    }

    // ========== TOPIC MANAGEMENT ==========

    /**
     * Get all forum topics by organization with pagination
     */
    public Mono<PaginatedResponse<com.service.backend.forum.dto.ForumTopicDTO>> getAllTopicsByOrganization(
            Integer organizationId, int page, int size) {
        log.info("Fetching forum topics for organization ID: {}, page: {}, size: {}", organizationId, page, size);
        long offset = (long) page * size;
        
        return forumTopicRepository.findByOrganizationIdWithPagination(organizationId, size, offset)
                .concatMap(this::convertToTopicDTOWithPostCount)
                .collectList()
                .zipWith(forumTopicRepository.countByOrganizationId(organizationId))
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, size))
                .doOnError(error -> log.error("Error fetching topics for organization ID: {}", organizationId, error));
    }

    /**
     * Get forum topic by ID
     */
    public Mono<com.service.backend.forum.dto.ForumTopicDTO> getTopicById(Integer topicId) {
        log.info("Fetching forum topic ID: {}", topicId);
        return forumTopicRepository.findById(topicId)
                .switchIfEmpty(Mono.defer(() -> Mono.error(new ApplicationException(ErrorCode.FORUM_TOPIC_NOT_FOUND))))
                .flatMap(this::convertToTopicDTOWithPostCount)
                .doOnError(error -> log.error("Error fetching topic ID: {}", topicId, error));
    }

    /**
     * Create a new forum topic
     */
    public Mono<com.service.backend.forum.dto.ForumTopicDTO> createTopic(
            Integer organizationId, Integer categoryId, String title, Integer createdByMemberId) {
        log.info("Creating forum topic: {}", title);
        return forumCategoryRepository.findById(categoryId)
                .switchIfEmpty(Mono.defer(() -> Mono.error(new ApplicationException(ErrorCode.FORUM_CATEGORY_NOT_FOUND))))
                .flatMap(category -> {
                    com.service.backend.forum.entity.ForumTopic topic = 
                            com.service.backend.forum.entity.ForumTopic.builder()
                                    .organizationId(organizationId)
                                    .categoryId(categoryId)
                                    .title(title)
                                    .createdByMemberId(createdByMemberId)
                                    .viewCount(0)
                                    .isLocked(false)
                                    .createdAt(java.time.LocalDateTime.now())
                                    .updatedAt(java.time.LocalDateTime.now())
                                    .build();
                    return forumTopicRepository.save(topic);
                })
                .flatMap(this::convertToTopicDTOWithPostCount)
                .doOnSuccess(result -> log.info("Successfully created forum topic: {}", title))
                .doOnError(error -> log.error("Error creating forum topic: {}", title, error));
    }

    /**
     * Update a forum topic
     */
    public Mono<com.service.backend.forum.dto.ForumTopicDTO> updateTopic(
            Integer topicId, String title, Integer categoryId) {
        log.info("Updating forum topic ID: {}", topicId);
        return forumTopicRepository.findById(topicId)
                .switchIfEmpty(Mono.defer(() -> Mono.error(new ApplicationException(ErrorCode.FORUM_TOPIC_NOT_FOUND))))
                .flatMap(topic -> {
                    if (title != null) topic.setTitle(title);
                    if (categoryId != null) topic.setCategoryId(categoryId);
                    topic.setUpdatedAt(java.time.LocalDateTime.now());
                    return forumTopicRepository.save(topic);
                })
                .flatMap(this::convertToTopicDTOWithPostCount)
                .doOnSuccess(result -> log.info("Successfully updated forum topic ID: {}", topicId))
                .doOnError(error -> log.error("Error updating topic ID: {}", topicId, error));
    }

    // ========== FORUM STATISTICS ==========

    /**
     * Get comprehensive forum statistics including:
     * - Overview counts (total posts, topics, categories, banned posts)
     * - Today's activity (new topics, new posts)
     * - Most popular topic (topic with the most posts)
     * - Most popular category (category with the most post activity)
     * - Ghost topics (topics > 7 days old with zero replies, up to 20)
     */
    public Mono<ForumStatisticsDTO> getForumStatistics() {
        log.info("Fetching comprehensive forum statistics");

        // 1. Overview & today counts (6 parallel queries)
        Mono<Long> totalPostsMono = forumPostRepository.count();
        Mono<Long> bannedPostsMono = forumPostRepository.countByIsBannedTrue();
        Mono<Long> totalTopicsMono = forumTopicRepository.count();
        Mono<Long> totalCategoriesMono = forumCategoryRepository.count();
        Mono<Long> newTopicsTodayMono = forumTopicRepository.countTopicsCreatedToday();
        Mono<Long> newPostsTodayMono = forumPostRepository.countPostsCreatedToday();

        Mono<ForumStatisticsDTO> baseMono = Mono.zip(
                totalPostsMono, bannedPostsMono, totalTopicsMono,
                totalCategoriesMono, newTopicsTodayMono, newPostsTodayMono
        ).map(tuple -> ForumStatisticsDTO.builder()
                .totalPosts(tuple.getT1())
                .bannedPosts(tuple.getT2())
                .totalTopics(tuple.getT3())
                .totalCategories(tuple.getT4())
                .newTopicsToday(tuple.getT5())
                .newPostsToday(tuple.getT6())
                .build());

        // 2. Most popular topic
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

        // 3. Most popular category
        Mono<ForumStatisticsDTO.CategorySummary> popularCategoryMono = forumTopicRepository.findCategoryIdWithMostPosts()
                .flatMap(categoryId -> forumCategoryRepository.findById(categoryId)
                        .zipWith(forumTopicRepository.countByCategoryId(categoryId))
                        .zipWith(forumPostRepository.countPostsByCategoryId(categoryId))
                        .map(tuple -> ForumStatisticsDTO.CategorySummary.builder()
                                .categoryId(tuple.getT1().getT1().getId())
                                .categoryName(tuple.getT1().getT1().getName())
                                .topicCount(tuple.getT1().getT2())
                                .postCount(tuple.getT2())
                                .build()))
                .defaultIfEmpty(ForumStatisticsDTO.CategorySummary.builder().build());

        // 4. Ghost topics
        Mono<List<ForumStatisticsDTO.GhostTopicSummary>> ghostTopicsMono = forumTopicRepository.findGhostTopics()
                .flatMap(topic -> {
                    // Resolve category name for each ghost topic
                    Mono<String> categoryNameMono = topic.getCategoryId() != null
                            ? forumCategoryRepository.findById(topic.getCategoryId())
                                    .map(ForumCategory::getName)
                                    .defaultIfEmpty("Unknown")
                            : Mono.just("Uncategorized");

                    return categoryNameMono.map(catName -> ForumStatisticsDTO.GhostTopicSummary.builder()
                            .topicId(topic.getId())
                            .title(topic.getTitle())
                            .categoryName(catName)
                            .viewCount(topic.getViewCount())
                            .createdAt(topic.getCreatedAt())
                            .build());
                })
                .collectList()
                .defaultIfEmpty(Collections.emptyList());

        // Combine everything
        return Mono.zip(baseMono, popularTopicMono, popularCategoryMono, ghostTopicsMono)
                .map(tuple -> {
                    ForumStatisticsDTO stats = tuple.getT1();
                    stats.setMostPopularTopic(tuple.getT2());
                    stats.setMostPopularCategory(tuple.getT3());
                    stats.setGhostTopics(tuple.getT4());
                    return stats;
                })
                .doOnSuccess(result -> log.info("Successfully retrieved comprehensive forum statistics"))
                .doOnError(error -> log.error("Error fetching forum statistics", error));
    }

    // ========== TOP CONTRIBUTORS ==========

    /**
     * Get top 10 contributors for a given month and year.
     * Returns member ID, user details, and post count.
     */
    public Mono<List<TopContributorDTO>> getTopContributors(int month, int year) {
        log.info("Fetching top contributors for month: {}, year: {}", month, year);

        return forumPostRepository.findTopContributorMemberIds(month, year)
                .flatMapSequential(memberId ->
                    // Look up user info via the user table (author_member_id = user_id in organization_members)
                    adminUserRepository.findById(memberId)
                            .zipWith(forumPostRepository.countPostsByAuthorInMonth(memberId, month, year))
                            .map(tuple -> TopContributorDTO.builder()
                                    .memberId(memberId)
                                    .userName(tuple.getT1().getUserName())
                                    .email(tuple.getT1().getEmail())
                                    .avatarUrl(tuple.getT1().getAvatarUrl())
                                    .postCount(tuple.getT2())
                                    .build())
                )
                .collectList()
                .defaultIfEmpty(Collections.emptyList())
                .doOnSuccess(result -> log.info("Successfully retrieved {} top contributors for {}/{}", result.size(), month, year))
                .doOnError(error -> log.error("Error fetching top contributors for {}/{}", month, year, error));
    }

    // ========== ORGANIZATION ENGAGEMENT RATE ==========

    /**
     * Get forum engagement rate per organization.
     * Returns: for each organization, total members vs active forum users (who posted at least once).
     */
    public Mono<List<OrganizationEngagementDTO>> getOrganizationEngagement() {
        log.info("Fetching organization engagement rates");

        return adminOrganizationRepository.findAll()
                .flatMap(org -> {
                    Mono<Long> totalMembersMono = adminOrganizationRepository
                            .countActiveMembersByOrganization(org.getId())
                            .defaultIfEmpty(0L);
                    Mono<Long> activeForumUsersMono = forumPostRepository
                            .countActiveForumUsersByOrganization(org.getId())
                            .defaultIfEmpty(0L);

                    return Mono.zip(totalMembersMono, activeForumUsersMono)
                            .map(tuple -> {
                                long totalMembers = tuple.getT1();
                                long activeUsers = tuple.getT2();

                                return OrganizationEngagementDTO.builder()
                                        .organizationId(org.getId())
                                        .organizationName(org.getName())
                                        .totalMembers(totalMembers)
                                        .activeForumUsers(activeUsers)
                                        .build();
                            });
                })
                .collectList()
                .defaultIfEmpty(Collections.emptyList())
                .doOnSuccess(result -> log.info("Successfully retrieved engagement rates for {} organizations", result.size()))
                .doOnError(error -> log.error("Error fetching organization engagement rates", error));
    }

    // ========== MONTHLY ACTIVITY TIMELINE ==========

    /**
     * Get monthly activity timeline for a given year.
     * Returns 12 months with: distinct active users, post count, topic count.
     */
    public Mono<MonthlyActivityDTO> getMonthlyActivityTimeline(int year) {
        log.info("Fetching monthly activity timeline for year: {}", year);

        // Build 12 month data entries in parallel
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

        return Flux.mergeSequential(monthMonos)
                .collectList()
                .map(months -> MonthlyActivityDTO.builder()
                        .year(year)
                        .months(months)
                        .build())
                .doOnSuccess(result -> log.info("Successfully retrieved monthly activity timeline for year: {}", year))
                .doOnError(error -> log.error("Error fetching monthly activity timeline for year: {}", year, error));
    }

    // ========== HELPER METHODS ==========

    /**
     * Convert ForumPost entity to ForumPostDTO
     */
    private Mono<ForumPostDTO> convertToPostDTO(ForumPost post) {
        Mono<Long> flagsCountMono = forumPostReportRepository.countByPostId(post.getId()).defaultIfEmpty(0L);
        Mono<com.service.backend.forum.entity.ForumTopic> topicMono = post.getTopicId() == null
                ? Mono.empty()
                : forumTopicRepository.findById(post.getTopicId());
        Mono<com.service.backend.forum.entity.ForumCategory> categoryMono = topicMono
                .flatMap(topic -> topic.getCategoryId() == null
                        ? Mono.empty()
                        : forumCategoryRepository.findById(topic.getCategoryId()));

        return Mono.zip(
                        flagsCountMono,
                        topicMono.defaultIfEmpty(com.service.backend.forum.entity.ForumTopic.builder().build()),
                        categoryMono.defaultIfEmpty(com.service.backend.forum.entity.ForumCategory.builder().build()))
                .map(tuple -> ForumPostDTO.builder()
                        .id(post.getId())
                        .topicId(post.getTopicId())
                        .authorMemberId(post.getAuthorMemberId())
                        .topicTitle(tuple.getT2().getTitle())
                        .categoryName(tuple.getT3().getName())
                        .flagsCount(tuple.getT1())
                        .content(post.getContent())
                        .answerToPostId(post.getAnswerToPostId())
                        .isBanned(post.getIsBanned())
                        .isHidden(post.getIsHidden())
                        .isLike(false)
                        .createdAt(post.getCreatedAt())
                        .updatedAt(post.getUpdatedAt())
                        .build());
    }

    private ForumPostReportDTO convertToReportDTO(ForumPostReport report) {
        return ForumPostReportDTO.builder()
                .id(report.getId())
                .postId(report.getPostId())
                .reporterMemberId(report.getReporterMemberId())
                .reason(report.getReason())
                .description(report.getDescription())
                .status(report.getStatus())
                .reviewedByUserId(report.getReviewedByUserId())
                .reviewNote(report.getReviewNote())
                .createdAt(report.getCreatedAt())
                .updatedAt(report.getUpdatedAt())
                .build();
    }

    private Mono<Void> applyModerationAction(ForumPostReport report, ReviewForumReportRequest request, Integer adminUserId) {
        String action = request.getAction().toUpperCase();
        if ("WARN".equals(action)) {
            return createAuditLog(adminUserId, null, "WARN_USER", "FORUM_REPORT",
                    String.valueOf(report.getId()), null, null);
        }
        return forumPostRepository.findById(report.getPostId())
                .switchIfEmpty(Mono.defer(() -> Mono.error(new ApplicationException(ErrorCode.FORUM_POST_NOT_FOUND))))
                .flatMap(post -> {
                    if ("HIDE_POST".equals(action)) {
                        post.setIsHidden(true);
                    } else if ("BAN_POST".equals(action)) {
                        post.setIsBanned(true);
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
        if (adminUserId == null) {
            return Mono.empty();
        }
        return adminAuditLogRepository
                .insertAuditLog(
                        adminUserId,
                        targetUserId,
                        action,
                        resourceType,
                        resourceId,
                        beforeData,
                        afterData,
                        null)
                .onErrorResume(primaryErr -> {
                    log.warn("Primary forum audit-log insert failed, retrying legacy schema for action {}", action, primaryErr);
                    return adminAuditLogRepository.insertAuditLogLegacy(
                            adminUserId,
                            targetUserId,
                            action);
                })
                .onErrorResume(fallbackErr -> {
                    log.warn("All forum audit-log insert attempts failed for action {}", action, fallbackErr);
                    return Mono.empty();
                })
                .then();
    }

    /**
     * Convert ForumCategory entity to ForumCategoryDTO
     */
    private com.service.backend.forum.dto.ForumCategoryDTO convertToCategoryDTO(
            com.service.backend.forum.entity.ForumCategory category) {
        return com.service.backend.forum.dto.ForumCategoryDTO.builder()
                .id(category.getId())
                .parentId(category.getParentId())
                .organizationId(category.getOrganizationId())
                .name(category.getName())
                .description(category.getDescription())
                .createdAt(category.getCreatedAt())
                .updatedAt(category.getUpdatedAt())
                .build();
    }

    /**
     * Convert ForumTopic entity to ForumTopicDTO
     */
    private Mono<com.service.backend.forum.dto.ForumTopicDTO> convertToTopicDTOWithPostCount(
            com.service.backend.forum.entity.ForumTopic topic) {
        return forumPostRepository.countByTopicId(topic.getId())
                .defaultIfEmpty(0L)
                .map(postCount -> convertToTopicDTO(topic, postCount));
    }

    private com.service.backend.forum.dto.ForumTopicDTO convertToTopicDTO(
            com.service.backend.forum.entity.ForumTopic topic,
            Long postCount) {
        return com.service.backend.forum.dto.ForumTopicDTO.builder()
                .id(topic.getId())
                .organizationId(topic.getOrganizationId())
                .title(topic.getTitle())
                .createdByMemberId(topic.getCreatedByMemberId())
                .categoryId(topic.getCategoryId())
                .viewCount(topic.getViewCount())
                .postCount(postCount)
                .createdAt(topic.getCreatedAt())
                .updatedAt(topic.getUpdatedAt())
                .build();
    }
}

