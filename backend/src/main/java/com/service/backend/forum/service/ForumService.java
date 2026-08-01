package com.service.backend.forum.service;

import org.springframework.transaction.annotation.Transactional;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.Optional;

import com.service.backend.shared.utils.CacheNames;
import com.service.backend.shared.utils.CacheUtils;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.utils.JsonUtils;
import com.service.backend.shared.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.service.backend.forum.dto.CreateForumCategoryRequest;
import com.service.backend.forum.dto.CreateForumPostRequest;
import com.service.backend.forum.dto.CreateForumTopicRequest;
import com.service.backend.forum.dto.CreateForumPostReactionRequest;
import com.service.backend.forum.dto.CreateForumPostReportRequest;
import com.service.backend.forum.dto.ForumCategoryDTO;
import com.service.backend.forum.dto.ForumPostDTO;
import com.service.backend.forum.dto.ForumPostReactionDTO;
import com.service.backend.forum.dto.ForumPostReportDTO;
import com.service.backend.forum.dto.ForumTopicDTO;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.enums.Status;
import com.service.backend.shared.dto.IdCountDTO;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.utils.PaginationHelper;
import com.service.backend.forum.dto.UpdateForumCategoryRequest;
import com.service.backend.forum.dto.UpdateForumTopicRequest;
import com.service.backend.forum.dto.UpdateForumPostRequest;
import com.service.backend.forum.dto.ForumTopicSubscriptionDTO;
import com.service.backend.forum.dto.CreateForumTopicSubscriptionRequest;
import com.service.backend.shared.entity.ForumCategory;
import com.service.backend.shared.entity.ForumPost;
import com.service.backend.shared.entity.ForumPostReaction;
import com.service.backend.shared.entity.ForumPostReport;
import com.service.backend.shared.entity.ForumTopic;
import com.service.backend.shared.entity.ForumTopicSubscription;
import com.service.backend.forum.dao.ForumCategoryRepository;
import com.service.backend.forum.dao.ForumPostRepository;
import com.service.backend.forum.dao.ForumPostReactionRepository;
import com.service.backend.forum.dao.ForumPostReportRepository;
import com.service.backend.forum.dao.ForumTopicRepository;
import com.service.backend.forum.dao.ForumTopicSubscriptionRepository;
import com.service.backend.shared.dao.UserDisplayInfo;
import com.service.backend.user.dao.UserProfileRepository;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class ForumService {
    private static final Logger log = LoggerFactory.getLogger(ForumService.class);

    private final ForumCategoryRepository forumCategoryRepository;
    private final ForumTopicRepository forumTopicRepository;
    private final ForumPostRepository forumPostRepository;
    private final ForumPostReactionRepository forumPostReactionRepository;
    private final ForumPostReportRepository forumPostReportRepository;
    private final ForumTopicSubscriptionRepository forumTopicSubscriptionRepository;
    private final UserProfileRepository userProfileRepository;
    private final CacheUtils cacheUtils;

    private Mono<Integer> currentMemberId() {
        return SecurityUtils.getCurrentUserId()
                .map(Long::intValue)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.FORBIDDEN)));
    }

    private Mono<Optional<Integer>> resolveAuthenticatedMemberId(Integer requestedMemberId) {
        if (requestedMemberId == null) {
            return Mono.just(Optional.empty());
        }
        return SecurityUtils.getCurrentUserId()
                .map(Long::intValue)
                .map(currentMemberId -> currentMemberId.equals(requestedMemberId)
                        ? Optional.of(currentMemberId)
                        : Optional.<Integer>empty())
                .defaultIfEmpty(Optional.empty())
                .onErrorReturn(Optional.empty());
    }

    private Mono<Void> assertPostOwnerOrManager(ForumPost post) {
        return forumTopicRepository.findById(post.getTopicId())
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.FORUM_TOPIC_NOT_FOUND)))
                .flatMap(topic -> Mono.zip(
                                currentMemberId(),
                                SecurityUtils.canManageContentOrganization(topic.getOrganizationId()))
                        .flatMap(ctx -> {
                            Integer memberId = ctx.getT1();
                            boolean canManage = ctx.getT2();
                            boolean ownsPost = post.getAuthorMemberId() != null
                                    && post.getAuthorMemberId().equals(memberId);
                            if (ownsPost || canManage) {
                                return Mono.empty();
                            }
                            return Mono.error(new ApplicationException(
                                    ErrorCode.FORBIDDEN,
                                    "Bạn không có quyền thao tác bài viết này"));
                        }));
    }

    // Category methods
    public Flux<ForumCategoryDTO> findAllCategoriesByOrganizationId(Integer organizationId) {
        String cacheKey = "forum_categories_org_" + organizationId;
        return cacheUtils.getOrCompute(CacheNames.FORUM_CATEGORY, cacheKey, Duration.ofDays(1), () ->
                forumCategoryRepository.findByOrganizationIdAndStatus(organizationId, Status.ACTIVE.name())
                        .collectList()
                        .flatMap(this::convertCategoriesWithStats)
                        .doOnSuccess(res -> log.info("Fetched {} forum categories for organization ID: {}", res.size(), organizationId))
        )
        .flatMapMany(Flux::fromIterable)
        .doOnError(error -> log.error("Error finding forum categories for organization ID: {}", organizationId, error));
    }

    public Mono<ForumCategoryDTO> createCategory(CreateForumCategoryRequest request) {
        return SecurityUtils.assertCanManageContentOrganization(request.getOrganizationId())
                .then(validateCategoryParent(request.getOrganizationId(), request.getParentId()))
                .then(Mono.defer(() -> {
                    ForumCategory category = ForumCategory.builder()
                            .parentId(request.getParentId())
                            .organizationId(request.getOrganizationId())
                            .name(request.getName())
                            .description(request.getDescription())
                            .status(Status.ACTIVE.name())
                            .build();

                    return forumCategoryRepository.save(category);
                }))
                .flatMap(this::convertToCategoryDTOWithStats)
                .delayUntil(res -> cacheUtils.clear(CacheNames.FORUM_CATEGORY))
                .doOnSuccess(result -> log.debug("createCategory result: {}", JsonUtils.toJson(result)))
                .doOnError(error -> log.error("Error creating forum category: {}", request.getName(), error));
    }

    private Mono<Void> validateCategoryParent(Integer organizationId, Integer parentId) {
        if (parentId == null) {
            return Mono.empty();
        }
        return forumCategoryRepository.findById(parentId)
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
                    return Mono.empty();
                });
    }

    public Mono<ForumCategoryDTO> updateCategory(Integer id, UpdateForumCategoryRequest request) {
        return forumCategoryRepository.findById(id)
                .switchIfEmpty(Mono.defer(() -> {
                    log.warn("Forum category not found with ID: {}", id);
                    return Mono.error(new ApplicationException(ErrorCode.FORUM_CATEGORY_NOT_FOUND));
                }))
                .flatMap(category -> SecurityUtils.assertCanManageContentOrganization(category.getOrganizationId())
                        .then(Mono.defer(() -> {
                            if (request.getName() != null) {
                                category.setName(request.getName());
                            }
                            if (request.getDescription() != null) {
                                category.setDescription(request.getDescription());
                            }
                            return forumCategoryRepository.save(category);
                        })))
                .flatMap(this::convertToCategoryDTOWithStats)
                .delayUntil(res -> cacheUtils.clear(CacheNames.FORUM_CATEGORY))
                .doOnSuccess(result -> log.debug("updateCategory result: {}", JsonUtils.toJson(result)))
                .doOnError(error -> log.error("Error updating forum category ID: {}", id, error));
    }

    public Mono<ForumCategoryDTO> findCategoryById(Integer id) {
        return forumCategoryRepository.findById(id)
                .flatMap(this::convertToCategoryDTOWithStats)
                .switchIfEmpty(Mono.defer(() -> {
                    log.warn("Forum category not found with ID: {}", id);
                    return Mono.error(new ApplicationException(ErrorCode.FORUM_CATEGORY_NOT_FOUND));
                }))
                .doOnSuccess(result -> log.debug("findCategoryById result: {}", JsonUtils.toJson(result)))
                .doOnError(error -> log.error("Error finding forum category ID: {}", id, error));
    }

    // Topic methods
    public Mono<ForumTopicDTO> findTopicById(Integer id) {
        return forumTopicRepository.findById(id)
                .flatMap(topic -> convertToTopicDTOWithPostCount(topic)
                        .flatMap(dto -> forumCategoryRepository.findById(topic.getCategoryId())
                                .flatMap(category -> {
                                    dto.setCategoryName(category.getName());
                                    if (category.getParentId() != null) {
                                        dto.setParentCategoryId(category.getParentId());
                                        return forumCategoryRepository.findById(category.getParentId())
                                                .map(parent -> {
                                                    dto.setParentCategoryName(parent.getName());
                                                    return dto;
                                                })
                                                .defaultIfEmpty(dto);
                                    }
                                    return Mono.just(dto);
                                })
                                .defaultIfEmpty(dto)
                        )
                )
                .switchIfEmpty(Mono.defer(() -> {
                    log.warn("Forum topic not found with ID: {}", id);
                    return Mono.error(new ApplicationException(ErrorCode.FORUM_TOPIC_NOT_FOUND));
                }))
                .doOnSuccess(result -> log.debug("findTopicById result: {}", JsonUtils.toJson(result)))
                .doOnError(error -> log.error("Error finding forum topic ID: {}", id, error));
    }

    public Mono<ForumTopicDTO> findTopicByTitle(String title) {
        return forumTopicRepository.findByTitle(title)
                .flatMap(this::convertToTopicDTOWithPostCount)
                .doOnSuccess(result -> {
                    if (result != null) {
                        log.debug("findTopicByTitle result: {}", JsonUtils.toJson(result));
                    } else {
                        log.warn("Forum topic not found with title: {}", title);
                    }
                })
                .doOnError(error -> log.error("Error finding forum topic by title: {}", title, error));
    }

    public Mono<PaginatedResponse<ForumTopicDTO>> findTopicsByCategoryId(Integer categoryId, String keyword, String sortBy, int page, int size) {
        long offset = (long) page * size;
        boolean mostViewed = "most_viewed".equalsIgnoreCase(sortBy);
        Flux<ForumTopic> topicsFlux = mostViewed
                ? forumTopicRepository.findActiveByCategoryIdOrderByViewCount(categoryId, keyword, size, offset)
                : forumTopicRepository.findActiveByCategoryIdWithPagination(categoryId, keyword, size, offset);
        return PaginationHelper.paginate(
                topicsFlux,
                forumTopicRepository.countActiveByCategoryId(categoryId, keyword),
                page, size,
                this::enrichTopicsWithPostCount)
                .doOnSuccess(result -> log.debug("findTopicsByCategoryId with keyword {} sortBy {} result: {}", keyword, sortBy, JsonUtils.toJson(result)))
                .doOnError(error -> log.error("Error finding forum topics for category ID: {}", categoryId, error));
    }

    /**
     * Enrich a page of topics with post counts + author display info using two batched queries
     * (post counts via {@code countByTopicIds}, authors via {@code findByUserIds}) instead of the
     * two-queries-per-topic {@link #convertToTopicDTOWithPostCount}.
     */
    private Mono<List<ForumTopicDTO>> enrichTopicsWithPostCount(List<ForumTopic> topics) {
        if (topics.isEmpty()) return Mono.just(List.of());
        Set<Integer> topicIds = new HashSet<>();
        Set<Integer> authorIds = new HashSet<>();
        for (ForumTopic t : topics) {
            topicIds.add(t.getId());
            if (t.getCreatedByMemberId() != null) authorIds.add(t.getCreatedByMemberId());
        }
        Mono<Map<Integer, Long>> countsMono = forumPostRepository.countByTopicIds(topicIds)
                .collectMap(IdCountDTO::getId, IdCountDTO::getCount);
        return Mono.zip(countsMono, userProfileRepository.findByUserIds(authorIds))
                .map(tuple -> {
                    Map<Integer, Long> counts = tuple.getT1();
                    Map<Integer, UserDisplayInfo> displays = tuple.getT2();
                    return topics.stream().map(topic -> {
                        ForumTopicDTO dto = convertToTopicDTO(topic, counts.getOrDefault(topic.getId(), 0L));
                        UserDisplayInfo info = topic.getCreatedByMemberId() != null
                                ? displays.get(topic.getCreatedByMemberId())
                                : null;
                        if (info != null) {
                            dto.setAuthorName(info.getFullName());
                            dto.setAuthorAvatarUrl(info.getAvatarUrl());
                        }
                        return dto;
                    }).collect(Collectors.toList());
                });
    }

    public Mono<ForumTopicDTO> createTopic(CreateForumTopicRequest request) {
        return currentMemberId().flatMap(memberId ->
                forumCategoryRepository.findById(request.getCategoryId())
                        .switchIfEmpty(Mono.defer(() -> {
                            log.error("Category not found with ID: {}", request.getCategoryId());
                            return Mono.error(new ApplicationException(ErrorCode.FORUM_CATEGORY_NOT_FOUND));
                        }))
                        .flatMap(category -> {
                            Integer organizationId = category.getOrganizationId();
                            if (organizationId == null || !organizationId.equals(request.getOrganizationId())) {
                                return Mono.error(new ApplicationException(
                                        ErrorCode.BAD_REQUEST,
                                        "Forum category does not belong to the requested organization"));
                            }
                            return SecurityUtils.assertCanSubmitContributorContent(organizationId)
                                    .then(Mono.defer(() -> {
                                        ForumTopic topic = ForumTopic.builder()
                                                .organizationId(organizationId)
                                                .title(request.getTitle())
                                                .createdByMemberId(memberId)
                                                .categoryId(request.getCategoryId())
                                                .viewCount(0)
                                                // User-created topics await admin approval before appearing publicly.
                                                .status(Status.PENDING.name())
                                                .build();

                                        return forumTopicRepository.save(topic);
                                    }));
                        }))
                .flatMap(this::convertToTopicDTOWithPostCount)
                .delayUntil(res -> cacheUtils.clear(CacheNames.FORUM_CATEGORY))
                .doOnSuccess(result -> log.debug("createTopic result: {}", JsonUtils.toJson(result)))
                .doOnError(error -> log.error("Error creating forum topic: {}", request.getTitle(), error));
    }

    public Mono<ForumTopicDTO> updateTopic(Integer id, UpdateForumTopicRequest request) {
        return forumTopicRepository.findById(id)
                .switchIfEmpty(Mono.defer(() -> {
                    log.warn("Forum topic not found with ID: {}", id);
                    return Mono.error(new ApplicationException(ErrorCode.FORUM_TOPIC_NOT_FOUND));
                }))
                .flatMap(topic -> SecurityUtils.assertCanManageContentOrganization(topic.getOrganizationId())
                        .then(Mono.defer(() -> {
                            if (request.getTitle() != null) {
                                topic.setTitle(request.getTitle());
                            }
                            if (request.getCategoryId() == null) {
                                return forumTopicRepository.save(topic);
                            }
                            return forumCategoryRepository.findById(request.getCategoryId())
                                    .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.FORUM_CATEGORY_NOT_FOUND)))
                                    .flatMap(category -> {
                                        if (topic.getOrganizationId() == null
                                                || !topic.getOrganizationId().equals(category.getOrganizationId())) {
                                            return Mono.error(new ApplicationException(
                                                    ErrorCode.BAD_REQUEST,
                                                    "Forum category does not belong to this topic organization"));
                                        }
                                        topic.setCategoryId(request.getCategoryId());
                                        return forumTopicRepository.save(topic);
                                    });
                        })))
                .flatMap(this::convertToTopicDTOWithPostCount)
                .delayUntil(res -> cacheUtils.clear(CacheNames.FORUM_CATEGORY))
                .doOnSuccess(result -> log.debug("updateTopic result: {}", JsonUtils.toJson(result)))
                .doOnError(error -> log.error("Error updating forum topic ID: {}", id, error));
    }
    public Mono<Void> deleteTopic(Integer topicId) {
        return forumTopicRepository.findById(topicId)
                .switchIfEmpty(Mono.defer(() -> Mono.error(new ApplicationException(ErrorCode.FORUM_TOPIC_NOT_FOUND))))
                .flatMap(topic -> SecurityUtils.assertCanManageContentOrganization(topic.getOrganizationId())
                        .then(cascadeDeleteTopic(topicId)))
                // Deleting a topic changes the category's topic/participant counts shown in the cached
                // category list — evict it, matching createTopic/updateTopic.
                .then(cacheUtils.clear(CacheNames.FORUM_CATEGORY))
                .doOnSuccess(v -> log.info("deleteTopic: topicId={} deleted", topicId))
                .doOnError(error -> log.error("Error deleting topic ID: {}", topicId, error));
    }

    private Mono<Void> cascadeDeleteTopic(Integer topicId) {
        return forumPostReactionRepository.deleteByTopicId(topicId)
                .then(forumPostReportRepository.deleteByTopicId(topicId))
                .then(forumTopicSubscriptionRepository.deleteByTopicId(topicId))
                .then(forumPostRepository.deleteByTopicId(topicId))
                .then(forumTopicRepository.deleteById(topicId));
    }

    // Post methods
    public Mono<PaginatedResponse<ForumPostDTO>> findPostsByTopicId(Integer topicId, int page, int size, Integer memberId) {
        forumTopicRepository.incrementViewCount(topicId)
                .onErrorResume(error -> {
                    log.warn("Failed to increment view count for topic ID: {}", topicId, error);
                    return Mono.empty();
                })
                .subscribe();

        return resolveAuthenticatedMemberId(memberId).flatMap(viewerMemberId -> {
            viewerMemberId.ifPresent(id -> forumTopicSubscriptionRepository.updateLastReadAt(topicId, id, java.time.LocalDateTime.now())
                    .onErrorResume(error -> {
                        log.warn("Failed to update last read at for topic ID: {}, member ID: {}", topicId, id, error);
                        return Mono.empty();
                    })
                    .subscribe());

            long offset = (long) page * size;

            Mono<List<ForumPost>> postsMono = forumPostRepository
                    .findByTopicIdWithPagination(topicId, size, offset)
                    .collectList();

            Mono<Long> countMono = forumPostRepository.countByTopicId(topicId);

            Mono<Set<Integer>> likedPostIdsMono = viewerMemberId
                    .map(id -> forumPostReactionRepository.findLikedPostIdsByTopicAndMember(topicId, id)
                            .collect(Collectors.toSet()))
                    .orElseGet(() -> Mono.just(new HashSet<>()));

            return likedPostIdsMono.flatMap(likedPostIds ->
                    PaginationHelper.paginate(
                            postsMono,
                            countMono,
                            page,
                            size,
                            posts -> {
                                Set<Integer> authorIds = posts.stream()
                                        .map(ForumPost::getAuthorMemberId)
                                        .filter(java.util.Objects::nonNull)
                                        .collect(Collectors.toSet());
                                return userProfileRepository.findByUserIds(authorIds)
                                        .map(displayMap -> posts.stream()
                                                .map(post -> {
                                                    ForumPostDTO dto = convertToPostDTO(post, likedPostIds.contains(post.getId()));
                                                    UserDisplayInfo info = post.getAuthorMemberId() != null
                                                            ? displayMap.get(post.getAuthorMemberId())
                                                            : null;
                                                    if (info != null) {
                                                        dto.setAuthorName(info.getFullName());
                                                        dto.setAuthorAvatarUrl(info.getAvatarUrl());
                                                    }
                                                    return dto;
                                                })
                                                .collect(Collectors.toList()));
                            }));
        })
                .doOnSuccess(result -> log.debug("findPostsByTopicId result: {}", JsonUtils.toJson(result)))
                .doOnError(error -> log.error("Error finding forum posts for topic ID: {}", topicId, error));
    }

    public Mono<ForumPostDTO> createPost(CreateForumPostRequest request) {
        if (request.getTopicId() == null || request.getTopicId() <= 0) {
            log.warn("Invalid topic ID: {}", request.getTopicId());
            return Mono.error(new ApplicationException(ErrorCode.INVALID_TOPIC_ID));
        }

        return currentMemberId().flatMap(memberId ->
                forumTopicRepository.findById(request.getTopicId())
                        .switchIfEmpty(Mono.defer(() -> {
                            log.error("Topic not found with ID: {}", request.getTopicId());
                            return Mono.error(new ApplicationException(ErrorCode.FORUM_TOPIC_NOT_FOUND));
                        }))
                        .flatMap(topic -> SecurityUtils.assertCanSubmitContributorContent(topic.getOrganizationId())
                                .then(Mono.defer(() -> {
                                    // ACTIVE topics accept posts from verified members. A PENDING topic
                                    // still accepts posts from its own creator so they can add the opening
                                    // post / follow-ups while it is pending. INACTIVE topics are closed.
                                    boolean isActive = Status.ACTIVE.name().equals(topic.getStatus());
                                    boolean isPendingByOwner = Status.PENDING.name().equals(topic.getStatus())
                                            && topic.getCreatedByMemberId() != null
                                            && topic.getCreatedByMemberId().equals(memberId);
                                    if (!isActive && !isPendingByOwner) {
                                        return Mono.error(new ApplicationException(ErrorCode.FORUM_TOPIC_LOCKED));
                                    }
                                    ForumPost post = ForumPost.builder()
                                            .topicId(request.getTopicId())
                                            .authorMemberId(memberId)
                                            .content(request.getContent())
                                            .answerToPostId(request.getAnswerToPostId())
                                            .isBanned(false)
                                            .isHidden(false)
                                            .build();

                                    return forumPostRepository.save(post);
                                }))))
                .flatMap(post -> {
                    String cacheKey = String.valueOf(post.getTopicId());
                    LocalDateTime createdAt = post.getCreatedAt() != null
                            ? post.getCreatedAt() : LocalDateTime.now();
                    return cacheUtils.putWithTtl(CacheNames.FORUM_RECENT_POSTS, cacheKey, createdAt, Duration.ofHours(4))
                            .thenReturn(post);
                })
                .map(this::convertToPostDTO)
                .doOnSuccess(result -> log.debug("createPost result: {}", JsonUtils.toJson(result)))
                .doOnError(error -> log.error("Error creating forum post for topic ID: {}", request.getTopicId(), error));
    }

    public Mono<ForumPostDTO> answerToPost(Integer postId, CreateForumPostRequest request) {
        request.setAnswerToPostId(postId);
        return createPost(request)
                .map(result -> {
                    result.setAnswerToPostId(postId);
                    return result;
                });
    }

    public Mono<ForumPostDTO> updatePost(Integer id, UpdateForumPostRequest request) {
        return forumPostRepository.findById(id)
                .switchIfEmpty(Mono.defer(() -> {
                    log.warn("Forum post not found with ID: {}", id);
                    return Mono.error(new ApplicationException(ErrorCode.FORUM_POST_NOT_FOUND));
                }))
                .flatMap(post -> assertPostOwnerOrManager(post)
                        .then(Mono.defer(() -> {
                            post.setContent(request.getContent());
                            return forumPostRepository.save(post);
                        })))
                .map(this::convertToPostDTO)
                .doOnSuccess(result -> log.debug("updatePost result: {}", JsonUtils.toJson(result)))
                .doOnError(error -> log.error("Error updating forum post ID: {}", id, error));
    }

    @Transactional
    public Mono<Void> deletePost(Integer id) {
        return forumPostRepository.findById(id)
                .switchIfEmpty(Mono.defer(() -> {
                    log.warn("Forum post not found with ID: {}", id);
                    return Mono.error(new ApplicationException(ErrorCode.FORUM_POST_NOT_FOUND));
                }))
                .flatMap(post -> assertPostOwnerOrManager(post)
                        .then(forumPostReactionRepository.deleteByPostId(id))
                        .then(forumPostRepository.clearAnswerReferences(id))
                        .then(forumPostRepository.deleteById(id)))
                .doOnSuccess(v -> log.info("deletePost: postId={} deleted", id))
                .doOnError(error -> log.error("Error deleting forum post ID: {}", id, error));
    }

    public Mono<ForumPostReportDTO> reportPost(Integer postId, CreateForumPostReportRequest request) {
        return currentMemberId().flatMap(reporterMemberId -> forumPostRepository.findById(postId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.FORUM_POST_NOT_FOUND)))
                .flatMap(post -> (Boolean.TRUE.equals(post.getIsBanned()) || Boolean.TRUE.equals(post.getIsHidden())
                        ? Mono.<Void>error(new ApplicationException(ErrorCode.FORUM_POST_NOT_FOUND))
                        : forumTopicRepository.findById(post.getTopicId())
                                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.FORUM_TOPIC_NOT_FOUND)))
                                .flatMap(topic -> SecurityUtils.assertCanSubmitContributorContent(topic.getOrganizationId()))))
                .then(Mono.defer(() -> {
                        ForumPostReport report = ForumPostReport.builder()
                            .postId(postId)
                            .reporterMemberId(reporterMemberId)
                            .reason(request.getReason())
                            .status(Status.PENDING)
                            .build();
                    return forumPostReportRepository.save(report);
                }))
                .map(this::convertToReportDTO)
                .doOnSuccess(r -> log.debug("reportPost result: {}", JsonUtils.toJson(r))));
    }

    // ========== REACTION METHODS (LIKE/DISLIKE) ==========

    @Transactional
    public Mono<ForumPostReactionDTO> reactToPost(CreateForumPostReactionRequest request) {
        return currentMemberId().flatMap(memberId ->
                forumPostRepository.findById(request.getPostId())
                        .switchIfEmpty(Mono.defer(() -> {
                            log.error("Post not found with ID: {}", request.getPostId());
                            return Mono.error(new ApplicationException(ErrorCode.FORUM_POST_NOT_FOUND));
                        }))
                        .flatMap(post -> (Boolean.TRUE.equals(post.getIsBanned()) || Boolean.TRUE.equals(post.getIsHidden())
                                ? Mono.<ForumPostReaction>error(new ApplicationException(ErrorCode.FORUM_POST_NOT_FOUND))
                                : forumTopicRepository.findById(post.getTopicId())
                                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.FORUM_TOPIC_NOT_FOUND)))
                                .flatMap(topic -> SecurityUtils.assertCanSubmitContributorContent(topic.getOrganizationId()))
                                .then(forumPostReactionRepository.findByPostIdAndMemberId(
                                            request.getPostId(), memberId)
                                        .hasElement()
                                        .flatMap(alreadyLiked -> {
                                            if (Boolean.TRUE.equals(alreadyLiked)) {
                                                return forumPostReactionRepository.deleteByPostIdAndMemberId(
                                                                request.getPostId(), memberId)
                                                        .then(Mono.empty());
                                            }
                                            log.info("Creating new like for post ID: {}, member: {}",
                                                    request.getPostId(), memberId);
                                            ForumPostReaction reaction = ForumPostReaction.builder()
                                                    .postId(request.getPostId())
                                                    .memberId(memberId)
                                                    .build();
                                            return forumPostReactionRepository.save(reaction);
                                        })))))
                .map(this::convertToReactionDTO)
                .doOnSuccess(result -> log.debug("reactToPost result: {}", JsonUtils.toJson(result)))
                .doOnError(error -> log.error("Error toggling like for post ID: {}", request.getPostId(), error));
    }

    public Mono<Map<String, Long>> getPostReactionCounts(Integer postId) {
        return forumPostReactionRepository.countByPostId(postId)
                .map(count -> {
                    Map<String, Long> map = new HashMap<>();
                    map.put("likes", count);
                    return map;
                })
                .doOnSuccess(result -> log.debug("getPostReactionCounts result: {}", JsonUtils.toJson(result)))
                .doOnError(error -> log.error("Error getting like count for post ID: {}", postId, error));
    }

    public Mono<ForumPostReactionDTO> getUserReaction(Integer postId, Integer memberId) {
        return currentMemberId().flatMap(currentMemberId -> {
            if (!currentMemberId.equals(memberId)) {
                return Mono.error(new ApplicationException(ErrorCode.FORBIDDEN));
            }
            return forumPostReactionRepository.findByPostIdAndMemberId(postId, currentMemberId);
        })
                .map(this::convertToReactionDTO)
                .doOnSuccess(result -> log.info("Found user reaction for post ID: {}", postId))
                .doOnError(error -> log.info("No reaction found for post ID: {} by member: {}", postId, memberId));
    }

    // ========== SUBSCRIPTION METHODS ==========

    @Transactional
    public Mono<ForumTopicSubscriptionDTO> subscribeToTopic(CreateForumTopicSubscriptionRequest request) {
        return currentMemberId().flatMap(memberId -> Mono.zip(
                        forumTopicRepository.findById(request.getTopicId())
                                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.FORUM_TOPIC_NOT_FOUND))),
                        forumTopicSubscriptionRepository.findByTopicIdAndMemberId(request.getTopicId(), memberId)
                                .map(Optional::of)
                                .defaultIfEmpty(Optional.empty())
                ).flatMap(tuple -> {
                    ForumTopic topic = tuple.getT1();
                    Optional<ForumTopicSubscription> existingSubscriptionOpt = tuple.getT2();
                    return SecurityUtils.assertCanSubmitContributorContent(topic.getOrganizationId())
                            .then(Mono.defer(() -> {
                                if (existingSubscriptionOpt.isPresent()) {
                                    log.debug("Removing existing subscription from topic ID: {}, member: {}",
                                            request.getTopicId(), memberId);
                                    return forumTopicSubscriptionRepository.deleteByTopicIdAndMemberId(
                                            request.getTopicId(), memberId)
                                            .then(Mono.empty());
                                }
                                log.debug("Creating new subscription for topic ID: {}, member: {}",
                                        request.getTopicId(), memberId);
                                ForumTopicSubscription subscription = ForumTopicSubscription.builder()
                                        .topicId(request.getTopicId())
                                        .memberId(memberId)
                                        .build();
                                return forumTopicSubscriptionRepository.save(subscription);
                            }));
                }))
                .map(this::convertToSubscriptionDTO)
                .doOnSuccess(result -> log.debug("subscribeToTopic result: {}", JsonUtils.toJson(result)))
                .doOnError(error -> log.error("Error toggling subscription for topic ID: {}", request.getTopicId(), error));
    }

    public Mono<Boolean> isSubscribed(Integer topicId, Integer memberId) {
        return currentMemberId().flatMap(currentMemberId -> {
            if (!currentMemberId.equals(memberId)) {
                return Mono.error(new ApplicationException(ErrorCode.FORBIDDEN));
            }
            return forumTopicSubscriptionRepository.findByTopicIdAndMemberId(topicId, currentMemberId)
                    .map(s -> true)
                    .defaultIfEmpty(false);
        });
    }

    // Helper methods to convert entities to DTOs
    private Mono<ForumCategoryDTO> convertToCategoryDTOWithStats(ForumCategory category) {
        ForumCategoryDTO base = convertToCategoryDTO(category);
        if (category.getParentId() == null) {
            return Mono.just(base);
        }

        Mono<Long> topicCountMono = forumTopicRepository.countActiveByCategoryId(category.getId()).defaultIfEmpty(0L);
        Mono<Long> participantCountMono = forumTopicRepository
                .countActiveDistinctParticipantsByCategoryId(category.getId())
                .defaultIfEmpty(0L);

        return Mono.zip(topicCountMono, participantCountMono)
                .map(tuple -> {
                    base.setTopicCount(tuple.getT1());
                    base.setParticipantCount(tuple.getT2());
                    return base;
                });
    }

    /**
     * Batch equivalent of the former per-category stats enrichment: gathers the topic and
     * participant counts for all sub-categories (parentId != null) in two queries instead of
     * two queries per category. Root categories (parentId == null) keep null counts as before.
     */
    private Mono<List<ForumCategoryDTO>> convertCategoriesWithStats(List<ForumCategory> categories) {
        if (categories.isEmpty()) return Mono.just(List.of());

        Set<Integer> subCategoryIds = categories.stream()
                .filter(c -> c.getParentId() != null)
                .map(ForumCategory::getId)
                .collect(Collectors.toSet());

        if (subCategoryIds.isEmpty()) {
            return Mono.just(categories.stream().map(this::convertToCategoryDTO).collect(Collectors.toList()));
        }

        Mono<Map<Integer, Long>> topicCountsMono = forumTopicRepository.countActiveByCategoryIds(subCategoryIds)
                .collectMap(IdCountDTO::getId, IdCountDTO::getCount);
        Mono<Map<Integer, Long>> participantCountsMono = forumTopicRepository.countActiveDistinctParticipantsByCategoryIds(subCategoryIds)
                .collectMap(IdCountDTO::getId, IdCountDTO::getCount);

        return Mono.zip(topicCountsMono, participantCountsMono)
                .map(tuple -> {
                    Map<Integer, Long> topicCounts = tuple.getT1();
                    Map<Integer, Long> participantCounts = tuple.getT2();
                    return categories.stream()
                            .map(category -> {
                                ForumCategoryDTO base = convertToCategoryDTO(category);
                                if (category.getParentId() != null) {
                                    base.setTopicCount(topicCounts.getOrDefault(category.getId(), 0L));
                                    base.setParticipantCount(participantCounts.getOrDefault(category.getId(), 0L));
                                }
                                return base;
                            })
                            .collect(Collectors.toList());
                });
    }

    private ForumCategoryDTO convertToCategoryDTO(ForumCategory category) {
        return ForumCategoryDTO.builder()
                .id(category.getId())
                .parentId(category.getParentId())
                .organizationId(category.getOrganizationId())
                .name(category.getName())
                .description(category.getDescription())
                .status(category.getStatus())
                .topicCount(null)
                .participantCount(null)
                .createdAt(category.getCreatedAt())
                .updatedAt(category.getUpdatedAt())
                .build();
    }

    private Mono<ForumTopicDTO> convertToTopicDTOWithPostCount(ForumTopic topic) {
        return forumPostRepository.countByTopicId(topic.getId())
                .defaultIfEmpty(0L)
                .flatMap(postCount -> {
                    ForumTopicDTO dto = convertToTopicDTO(topic, postCount);
                    if (topic.getCreatedByMemberId() == null) {
                        return Mono.just(dto);
                    }
                    return userProfileRepository.findDisplayInfoByUserId(topic.getCreatedByMemberId())
                            .map(info -> {
                                dto.setAuthorName(info.getFullName());
                                dto.setAuthorAvatarUrl(info.getAvatarUrl());
                                return dto;
                            })
                            .defaultIfEmpty(dto);
                });
    }

    private ForumTopicDTO convertToTopicDTO(ForumTopic topic, Long postCount) {
        return ForumTopicDTO.builder()
                .id(topic.getId())
                .organizationId(topic.getOrganizationId())
                .title(topic.getTitle())
                .createdByMemberId(topic.getCreatedByMemberId())
                .authorName(null)
                .authorAvatarUrl(null)
                .categoryId(topic.getCategoryId())
                .viewCount(topic.getViewCount())
                .status(topic.getStatus())
                .postCount(postCount)
                .createdAt(topic.getCreatedAt())
                .updatedAt(topic.getUpdatedAt())
                .build();
    }

    private ForumPostDTO convertToPostDTO(ForumPost post) {
        return convertToPostDTO(post, false);
    }

    private ForumPostDTO convertToPostDTO(ForumPost post, Boolean isLike) {
        return ForumPostDTO.builder()
                .id(post.getId())
                .topicId(post.getTopicId())
                .authorMemberId(post.getAuthorMemberId())
                .content(post.getContent())
                .answerToPostId(post.getAnswerToPostId())
                .isBanned(post.getIsBanned())
                .isHidden(post.getIsHidden())
                .isLike(isLike)
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
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

    private ForumPostReactionDTO convertToReactionDTO(ForumPostReaction reaction) {
        return ForumPostReactionDTO.builder()
                .id(reaction.getId())
                .postId(reaction.getPostId())
                .memberId(reaction.getMemberId())
                .createdAt(reaction.getCreatedAt())
                .build();
    }

    private ForumTopicSubscriptionDTO convertToSubscriptionDTO(ForumTopicSubscription subscription) {
        return ForumTopicSubscriptionDTO.builder()
                .id(subscription.getId())
                .topicId(subscription.getTopicId())
                .memberId(subscription.getMemberId())
                .lastReadAt(subscription.getLastReadAt())
                .lastNotifiedAt(subscription.getLastNotifiedAt())
                .createdAt(subscription.getCreatedAt())
                .build();
    }
}
