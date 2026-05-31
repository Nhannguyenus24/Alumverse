package com.service.backend.forum.service;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.utils.JsonUtils;
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
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.forum.dto.UpdateForumCategoryRequest;
import com.service.backend.forum.dto.UpdateForumTopicRequest;
import com.service.backend.forum.dto.UpdateForumPostRequest;
import com.service.backend.forum.entity.ForumCategory;
import com.service.backend.forum.entity.ForumPost;
import com.service.backend.forum.entity.ForumPostReaction;
import com.service.backend.forum.entity.ForumPostReport;
import com.service.backend.forum.entity.ForumTopic;
import com.service.backend.forum.dao.ForumCategoryRepository;
import com.service.backend.forum.dao.ForumPostRepository;
import com.service.backend.forum.dao.ForumPostReactionRepository;
import com.service.backend.forum.dao.ForumPostReportRepository;
import com.service.backend.forum.dao.ForumTopicRepository;

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

    // Category methods
    public Flux<ForumCategoryDTO> findAllCategoriesByOrganizationId(Integer organizationId) {
        return forumCategoryRepository.findByOrganizationId(organizationId)
                .flatMap(this::convertToCategoryDTOWithStats)
                .doOnError(error -> log.error("Error finding forum categories for organization ID: {}", organizationId, error));
    }

    public Mono<ForumCategoryDTO> createCategory(CreateForumCategoryRequest request) {
        ForumCategory category = ForumCategory.builder()
                .parentId(request.getParentId())
                .organizationId(request.getOrganizationId())
                .name(request.getName())
                .description(request.getDescription())
                .build();

        return forumCategoryRepository.save(category)
            .flatMap(this::convertToCategoryDTOWithStats)
                .doOnSuccess(result -> log.info("createCategory result: {}", JsonUtils.toJson(result)))
                .doOnError(error -> log.error("Error creating forum category: {}", request.getName(), error));
    }

    public Mono<ForumCategoryDTO> updateCategory(Integer id, UpdateForumCategoryRequest request) {
        return forumCategoryRepository.findById(id)
                .switchIfEmpty(Mono.defer(() -> {
                    log.warn("Forum category not found with ID: {}", id);
                    return Mono.error(new ApplicationException(ErrorCode.FORUM_CATEGORY_NOT_FOUND));
                }))
                .flatMap(category -> {
                    if (request.getName() != null) {
                        category.setName(request.getName());
                    }
                    if (request.getDescription() != null) {
                        category.setDescription(request.getDescription());
                    }
                    return forumCategoryRepository.save(category);
                })
                .flatMap(this::convertToCategoryDTOWithStats)
                .doOnSuccess(result -> log.info("updateCategory result: {}", JsonUtils.toJson(result)))
                .doOnError(error -> log.error("Error updating forum category ID: {}", id, error));
    }

    public Mono<ForumCategoryDTO> findCategoryById(Integer id) {
        return forumCategoryRepository.findById(id)
                .flatMap(this::convertToCategoryDTOWithStats)
                .switchIfEmpty(Mono.defer(() -> {
                    log.warn("Forum category not found with ID: {}", id);
                    return Mono.error(new ApplicationException(ErrorCode.FORUM_CATEGORY_NOT_FOUND));
                }))
                .doOnSuccess(result -> log.info("findCategoryById result: {}", JsonUtils.toJson(result)))
                .doOnError(error -> log.error("Error finding forum category ID: {}", id, error));
    }

    // Topic methods
    public Mono<ForumTopicDTO> findTopicByTitle(String title) {
        return forumTopicRepository.findByTitle(title)
                .flatMap(this::convertToTopicDTOWithPostCount)
                .doOnSuccess(result -> {
                    if (result != null) {
                        log.info("findTopicByTitle result: {}", JsonUtils.toJson(result));
                    } else {
                        log.warn("Forum topic not found with title: {}", title);
                    }
                })
                .doOnError(error -> log.error("Error finding forum topic by title: {}", title, error));
    }

    public Mono<PaginatedResponse<ForumTopicDTO>> findTopicsByCategoryId(Integer categoryId, int page, int size) {
        long offset = (long) page * size;
        return forumTopicRepository.findByCategoryIdWithPagination(categoryId, size, offset)
                .concatMap(this::convertToTopicDTOWithPostCount)
                .collectList()
                .zipWith(forumTopicRepository.countByCategoryId(categoryId))
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, size))
                .doOnSuccess(result -> log.info("findTopicsByCategoryId result: {}", JsonUtils.toJson(result)))
                .doOnError(error -> log.error("Error finding forum topics for category ID: {}", categoryId, error));
    }

    public Mono<ForumTopicDTO> createTopic(CreateForumTopicRequest request) {
        return forumCategoryRepository.findById(request.getCategoryId())
                .switchIfEmpty(Mono.defer(() -> {
                    log.error("Category not found with ID: {}", request.getCategoryId());
                    return Mono.error(new ApplicationException(ErrorCode.FORUM_CATEGORY_NOT_FOUND));
                }))
                .flatMap(category -> {
                    ForumTopic topic = ForumTopic.builder()
                            .organizationId(request.getOrganizationId())
                            .title(request.getTitle())
                            .createdByMemberId(request.getCreatedByMemberId())
                            .categoryId(request.getCategoryId())
                            .viewCount(0)
                            .isLocked(false)
                            .build();

                    return forumTopicRepository.save(topic);
                })
                .flatMap(this::convertToTopicDTOWithPostCount)
                .doOnSuccess(result -> log.info("createTopic result: {}", JsonUtils.toJson(result)))
                .doOnError(error -> log.error("Error creating forum topic: {}", request.getTitle(), error));
    }

    public Mono<ForumTopicDTO> updateTopic(Integer id, UpdateForumTopicRequest request) {
        return forumTopicRepository.findById(id)
                .switchIfEmpty(Mono.defer(() -> {
                    log.warn("Forum topic not found with ID: {}", id);
                    return Mono.error(new ApplicationException(ErrorCode.FORUM_TOPIC_NOT_FOUND));
                }))
                .flatMap(topic -> {
                    if (request.getTitle() != null) {
                        topic.setTitle(request.getTitle());
                    }
                    if (request.getCategoryId() != null) {
                        topic.setCategoryId(request.getCategoryId());
                    }
                    return forumTopicRepository.save(topic);
                })
                .flatMap(this::convertToTopicDTOWithPostCount)
                .doOnSuccess(result -> log.info("updateTopic result: {}", JsonUtils.toJson(result)))
                .doOnError(error -> log.error("Error updating forum topic ID: {}", id, error));
    }

    // Post methods
    public Mono<PaginatedResponse<ForumPostDTO>> findPostsByTopicId(Integer topicId, int page, int size, Integer memberId) {
        forumTopicRepository.incrementViewCount(topicId)
                .onErrorResume(error -> {
                    log.warn("Failed to increment view count for topic ID: {}", topicId, error);
                    return Mono.empty();
                })
                .subscribe();

        long offset = (long) page * size;

        Mono<List<ForumPost>> postsMono = forumPostRepository
                .findByTopicIdWithPagination(topicId, size, offset)
                .collectList();

        Mono<Long> countMono = forumPostRepository.countByTopicId(topicId);

        Mono<Set<Integer>> likedPostIdsMono = memberId != null
                ? forumPostReactionRepository.findLikedPostIdsByTopicAndMember(topicId, memberId)
                    .collect(Collectors.toSet())
                : Mono.just(new HashSet<>());

        return Mono.zip(postsMono, countMono, likedPostIdsMono)
                .map(tuple -> {
                    var posts = tuple.getT1();
                    var totalItems = tuple.getT2();
                    var likedPostIds = tuple.getT3();

                    var postDTOs = posts.stream()
                            .map(post -> convertToPostDTO(post, likedPostIds.contains(post.getId())))
                            .collect(Collectors.toList());

                    return PaginatedResponse.of(postDTOs, totalItems, page, size);
                })
                .doOnSuccess(result -> log.info("findPostsByTopicId result: {}", JsonUtils.toJson(result)))
                .doOnError(error -> log.error("Error finding forum posts for topic ID: {}", topicId, error));
    }

    public Mono<ForumPostDTO> createPost(CreateForumPostRequest request) {
        if (request.getTopicId() == null || request.getTopicId() <= 0) {
            log.warn("Invalid topic ID: {}", request.getTopicId());
            return Mono.error(new ApplicationException(ErrorCode.INVALID_TOPIC_ID));
        }

        return forumTopicRepository.findById(request.getTopicId())
                .switchIfEmpty(Mono.defer(() -> {
                    log.error("Topic not found with ID: {}", request.getTopicId());
                    return Mono.error(new ApplicationException(ErrorCode.FORUM_TOPIC_NOT_FOUND));
                }))
                .flatMap(topic -> {
                    if (Boolean.TRUE.equals(topic.getIsLocked())) {
                        return Mono.error(new ApplicationException(ErrorCode.FORUM_TOPIC_LOCKED));
                    }
                    ForumPost post = ForumPost.builder()
                            .topicId(request.getTopicId())
                            .authorMemberId(request.getAuthorMemberId())
                            .content(request.getContent())
                            .answerToPostId(request.getAnswerToPostId())
                            .isBanned(false)
                            .isHidden(false)
                            .build();

                    return forumPostRepository.save(post);
                })
                .map(this::convertToPostDTO)
                .doOnSuccess(result -> log.info("createPost result: {}", JsonUtils.toJson(result)))
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
                .flatMap(post -> {
                    post.setContent(request.getContent());
                    return forumPostRepository.save(post);
                })
                .map(this::convertToPostDTO)
                .doOnSuccess(result -> log.info("updatePost result: {}", JsonUtils.toJson(result)))
                .doOnError(error -> log.error("Error updating forum post ID: {}", id, error));
    }

    public Mono<Void> deletePost(Integer id) {
        return forumPostRepository.findById(id)
                .switchIfEmpty(Mono.defer(() -> {
                    log.warn("Forum post not found with ID: {}", id);
                    return Mono.error(new ApplicationException(ErrorCode.FORUM_POST_NOT_FOUND));
                }))
                .flatMap(post -> forumPostReactionRepository.deleteByPostId(id)
                        .then(forumPostRepository.deleteById(id)))
                .doOnSuccess(v -> log.info("deletePost: postId={} deleted", id))
                .doOnError(error -> log.error("Error deleting forum post ID: {}", id, error));
    }

    public Mono<ForumPostReportDTO> reportPost(Integer postId, CreateForumPostReportRequest request) {
        return forumPostRepository.findById(postId)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.FORUM_POST_NOT_FOUND)))
                .flatMap(post -> {
                    ForumPostReport report = ForumPostReport.builder()
                            .postId(postId)
                            .reporterMemberId(request.getReporterMemberId())
                            .reason(request.getReason())
                            .description(request.getDescription())
                            .status("PENDING")
                            .build();
                    return forumPostReportRepository.save(report);
                })
                .map(this::convertToReportDTO)
                .doOnSuccess(r -> log.info("reportPost result: {}", JsonUtils.toJson(r)));
    }

    // ========== REACTION METHODS (LIKE/DISLIKE) ==========

    public Mono<ForumPostReactionDTO> reactToPost(CreateForumPostReactionRequest request) {
        return forumPostRepository.findById(request.getPostId())
                .switchIfEmpty(Mono.defer(() -> {
                    log.error("Post not found with ID: {}", request.getPostId());
                    return Mono.error(new ApplicationException(ErrorCode.FORUM_POST_NOT_FOUND));
                }))
                .flatMap(post -> forumPostReactionRepository.findByPostIdAndMemberId(
                            request.getPostId(), request.getMemberId())
                        .flatMap(existingReaction -> {
                            log.info("Removing existing like from post ID: {}, member: {}",
                                    request.getPostId(), request.getMemberId());
                            return forumPostReactionRepository.deleteByPostIdAndMemberId(
                                    request.getPostId(), request.getMemberId())
                                    .then(Mono.<ForumPostReaction>empty());
                        })
                        .switchIfEmpty(Mono.defer(() -> {
                            log.info("Creating new like for post ID: {}, member: {}",
                                    request.getPostId(), request.getMemberId());
                            ForumPostReaction reaction = ForumPostReaction.builder()
                                    .postId(request.getPostId())
                                    .memberId(request.getMemberId())
                                    .build();
                            return forumPostReactionRepository.save(reaction);
                        })))
                .map(this::convertToReactionDTO)
                .doOnSuccess(result -> log.info("reactToPost result: {}", JsonUtils.toJson(result)))
                .doOnError(error -> log.error("Error toggling like for post ID: {}", request.getPostId(), error));
    }

    public Mono<Map<String, Long>> getPostReactionCounts(Integer postId) {
        return forumPostReactionRepository.countByPostId(postId)
                .map(count -> {
                    Map<String, Long> map = new HashMap<>();
                    map.put("likes", count);
                    return map;
                })
                .doOnSuccess(result -> log.info("getPostReactionCounts result: {}", JsonUtils.toJson(result)))
                .doOnError(error -> log.error("Error getting like count for post ID: {}", postId, error));
    }

    public Mono<ForumPostReactionDTO> getUserReaction(Integer postId, Integer memberId) {
        return forumPostReactionRepository.findByPostIdAndMemberId(postId, memberId)
                .map(this::convertToReactionDTO)
                .doOnSuccess(result -> log.info("Found user reaction for post ID: {}", postId))
                .doOnError(error -> log.info("No reaction found for post ID: {} by member: {}", postId, memberId));
    }

    // Helper methods to convert entities to DTOs
    private Mono<ForumCategoryDTO> convertToCategoryDTOWithStats(ForumCategory category) {
        ForumCategoryDTO base = convertToCategoryDTO(category);
        if (category.getParentId() == null) {
            return Mono.just(base);
        }

        Mono<Long> topicCountMono = forumTopicRepository.countByCategoryId(category.getId()).defaultIfEmpty(0L);
        Mono<Long> participantCountMono = forumTopicRepository
                .countDistinctParticipantsByCategoryId(category.getId())
                .defaultIfEmpty(0L);

        return Mono.zip(topicCountMono, participantCountMono)
                .map(tuple -> {
                    base.setTopicCount(tuple.getT1());
                    base.setParticipantCount(tuple.getT2());
                    return base;
                });
    }

    private ForumCategoryDTO convertToCategoryDTO(ForumCategory category) {
        return ForumCategoryDTO.builder()
                .id(category.getId())
                .parentId(category.getParentId())
                .organizationId(category.getOrganizationId())
                .name(category.getName())
                .description(category.getDescription())
                .topicCount(null)
                .participantCount(null)
                .createdAt(category.getCreatedAt())
                .updatedAt(category.getUpdatedAt())
                .build();
    }

    private Mono<ForumTopicDTO> convertToTopicDTOWithPostCount(ForumTopic topic) {
        return forumPostRepository.countByTopicId(topic.getId())
                .defaultIfEmpty(0L)
                .map(postCount -> convertToTopicDTO(topic, postCount));
    }

    private ForumTopicDTO convertToTopicDTO(ForumTopic topic, Long postCount) {
        return ForumTopicDTO.builder()
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
                .description(report.getDescription())
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
}
