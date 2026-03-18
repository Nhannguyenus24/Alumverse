package com.service.backend.forum.service;

import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.service.backend.forum.dto.CreateForumCategoryRequest;
import com.service.backend.forum.dto.CreateForumPostRequest;
import com.service.backend.forum.dto.CreateForumTopicRequest;
import com.service.backend.forum.dto.CreateForumPostReactionRequest;
import com.service.backend.forum.dto.ForumCategoryDTO;
import com.service.backend.forum.dto.ForumPostDTO;
import com.service.backend.forum.dto.ForumPostPageResponse;
import com.service.backend.forum.dto.ForumPostReactionDTO;
import com.service.backend.forum.dto.ForumTopicDTO;
import com.service.backend.forum.dto.ForumTopicPageResponse;
import com.service.backend.shared.dto.PageInfo;
import com.service.backend.forum.dto.UpdateForumCategoryRequest;
import com.service.backend.forum.dto.UpdateForumTopicRequest;
import com.service.backend.forum.entities.ForumCategory;
import com.service.backend.forum.entities.ForumPost;
import com.service.backend.forum.entities.ForumPostReaction;
import com.service.backend.forum.entities.ForumTopic;
import com.service.backend.forum.repository.ForumCategoryRepository;
import com.service.backend.forum.repository.ForumPostRepository;
import com.service.backend.forum.repository.ForumPostReactionRepository;
import com.service.backend.forum.repository.ForumTopicRepository;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
public class ForumService {
    private static final Logger log = LoggerFactory.getLogger(ForumService.class);

    private final ForumCategoryRepository forumCategoryRepository;
    private final ForumTopicRepository forumTopicRepository;
    private final ForumPostRepository forumPostRepository;
    private final ForumPostReactionRepository forumPostReactionRepository;

    public ForumService(ForumCategoryRepository forumCategoryRepository,
                        ForumTopicRepository forumTopicRepository,
                        ForumPostRepository forumPostRepository,
                        ForumPostReactionRepository forumPostReactionRepository) {
        this.forumCategoryRepository = forumCategoryRepository;
        this.forumTopicRepository = forumTopicRepository;
        this.forumPostRepository = forumPostRepository;
        this.forumPostReactionRepository = forumPostReactionRepository;
    }

    // Helper method to calculate PageInfo
    private PageInfo calculatePageInfo(int currentPage, int pageSize, long totalItems) {
        int totalPages = (int) Math.ceil((double) totalItems / pageSize);
        return PageInfo.builder()
                .currentPage(currentPage)
                .pageSize(pageSize)
                .totalPage(totalPages)
                .totalItem((int) totalItems)
                .hasNext(currentPage < totalPages - 1)
                .hasPrevious(currentPage > 0)
                .build();
    }

    // Category methods
    public Flux<ForumCategoryDTO> findAllCategoriesByOrganizationId(Integer organizationId) {
        log.info("Finding all forum categories for organization ID: {}", organizationId);
        return forumCategoryRepository.findByOrganizationId(organizationId)
                .map(this::convertToCategoryDTO)
                .doOnComplete(() -> log.info("Successfully retrieved forum categories for organization ID: {}", organizationId))
                .doOnError(error -> log.error("Error finding forum categories for organization ID: {}", organizationId, error));
    }

    public Mono<ForumCategoryDTO> createCategory(CreateForumCategoryRequest request) {
        log.info("Creating forum category: {}", request.getName());
        ForumCategory category = ForumCategory.builder()
                .organizationId(request.getOrganizationId())
                .name(request.getName())
                .description(request.getDescription())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        
        return forumCategoryRepository.save(category)
                .map(this::convertToCategoryDTO)
                .doOnSuccess(result -> log.info("Successfully created forum category with ID: {}", result.getId()))
                .doOnError(error -> log.error("Error creating forum category: {}", request.getName(), error));
    }

    public Mono<ForumCategoryDTO> updateCategory(Integer id, UpdateForumCategoryRequest request) {
        log.info("Updating forum category ID: {}", id);
        return forumCategoryRepository.findById(id)
                .switchIfEmpty(Mono.defer(() -> {
                    log.warn("Forum category not found with ID: {}", id);
                    return Mono.error(new RuntimeException("Forum category not found with ID: " + id));
                }))
                .flatMap(category -> {
                    if (request.getName() != null) {
                        category.setName(request.getName());
                    }
                    if (request.getDescription() != null) {
                        category.setDescription(request.getDescription());
                    }
                    category.setUpdatedAt(LocalDateTime.now());
                    return forumCategoryRepository.save(category);
                })
                .map(this::convertToCategoryDTO)
                .doOnSuccess(result -> log.info("Successfully updated forum category ID: {}", id))
                .doOnError(error -> log.error("Error updating forum category ID: {}", id, error));
    }

    public Mono<Void> deleteCategory(Integer id) {
        log.info("Deleting forum category ID: {}", id);
        return forumCategoryRepository.deleteById(id)
                .doOnSuccess(result -> log.info("Successfully deleted forum category ID: {}", id))
                .doOnError(error -> log.error("Error deleting forum category ID: {}", id, error));
    }

    // Topic methods
    public Mono<ForumTopicDTO> findTopicByTitle(String title) {
        log.info("Finding forum topic by title: {}", title);
        return forumTopicRepository.findByTitle(title)
                .map(this::convertToTopicDTO)
                .doOnSuccess(result -> {
                    if (result != null) {
                        log.info("Successfully found forum topic: {}", title);
                    } else {
                        log.warn("Forum topic not found with title: {}", title);
                    }
                })
                .doOnError(error -> log.error("Error finding forum topic by title: {}", title, error));
    }

    public Mono<ForumTopicPageResponse> findTopicsByCategoryId(Integer categoryId, int page, int size) {
        log.info("Finding forum topics for category ID: {}, page: {}, size: {}", categoryId, page, size);
        long offset = (long) page * size;
        
        return forumTopicRepository.findByCategoryIdWithPagination(categoryId, size, offset)
                .map(this::convertToTopicDTO)
                .collectList()
                .zipWith(forumTopicRepository.countByCategoryId(categoryId))
                .map(tuple -> {
                    var topics = tuple.getT1();
                    var totalItems = tuple.getT2();
                    var pageInfo = calculatePageInfo(page, size, totalItems);
                    return ForumTopicPageResponse.builder()
                            .items(topics)
                            .pageInfo(pageInfo)
                            .build();
                })
                .doOnSuccess(result -> log.info("Successfully retrieved forum topics for category ID: {}", categoryId))
                .doOnError(error -> log.error("Error finding forum topics for category ID: {}", categoryId, error));
    }

    public Mono<ForumTopicDTO> createTopic(CreateForumTopicRequest request) {
        log.info("Creating forum topic: {}", request.getTitle());
        
        // Verify category exists before creating topic
        return forumCategoryRepository.findById(request.getCategoryId())
                .switchIfEmpty(Mono.defer(() -> {
                    log.error("Category not found with ID: {}", request.getCategoryId());
                    return Mono.error(new RuntimeException("Category not found with ID: " + request.getCategoryId()));
                }))
                .flatMap(category -> {
                    ForumTopic topic = ForumTopic.builder()
                            .organizationId(request.getOrganizationId())
                            .title(request.getTitle())
                            .createdByMemberId(request.getCreatedByMemberId())
                            .categoryId(request.getCategoryId())
                            .viewCount(0)
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .build();
                    
                    return forumTopicRepository.save(topic);
                })
                .map(this::convertToTopicDTO)
                .doOnSuccess(result -> log.info("Successfully created forum topic with ID: {}", result.getId()))
                .doOnError(error -> log.error("Error creating forum topic: {}", request.getTitle(), error));
    }

    public Mono<ForumTopicDTO> updateTopic(Integer id, UpdateForumTopicRequest request) {
        log.info("Updating forum topic ID: {}", id);
        return forumTopicRepository.findById(id)
                .switchIfEmpty(Mono.defer(() -> {
                    log.warn("Forum topic not found with ID: {}", id);
                    return Mono.error(new RuntimeException("Forum topic not found with ID: " + id));
                }))
                .flatMap(topic -> {
                    if (request.getTitle() != null) {
                        topic.setTitle(request.getTitle());
                    }
                    if (request.getCategoryId() != null) {
                        topic.setCategoryId(request.getCategoryId());
                    }
                    topic.setUpdatedAt(LocalDateTime.now());
                    return forumTopicRepository.save(topic);
                })
                .map(this::convertToTopicDTO)
                .doOnSuccess(result -> log.info("Successfully updated forum topic ID: {}", id))
                .doOnError(error -> log.error("Error updating forum topic ID: {}", id, error));
    }

    public Mono<Void> deleteTopic(Integer id) {
        log.info("Deleting forum topic ID: {}", id);
        return forumTopicRepository.deleteById(id)
                .doOnSuccess(result -> log.info("Successfully deleted forum topic ID: {}", id))
                .doOnError(error -> log.error("Error deleting forum topic ID: {}", id, error));
    }

    // Post methods
    public Mono<ForumPostPageResponse> findPostsByTopicId(Integer topicId, int page, int size, Integer memberId) {
        log.info("Finding forum posts for topic ID: {}, page: {}, size: {}, memberId: {}", topicId, page, size, memberId);
        
        // Fire and forget: increment view count for topic
        forumTopicRepository.incrementViewCount(topicId)
                .doOnSuccess(count -> log.debug("Incremented view count for topic ID: {}", topicId))
                .doOnError(error -> log.warn("Failed to increment view count for topic ID: {}", topicId, error))
                .subscribe();
        
        long offset = (long) page * size;
        return forumPostRepository.findByTopicIdWithPagination(topicId, size, offset)
                .flatMap(post -> {
                    // If memberId is provided, check if user has liked this post
                    if (memberId != null) {
                        return forumPostReactionRepository.findByPostIdAndMemberId(post.getId(), memberId)
                                .map(reaction -> convertToPostDTO(post, true))
                                .switchIfEmpty(Mono.just(convertToPostDTO(post, false)));
                    } else {
                        return Mono.just(convertToPostDTO(post, false));
                    }
                })
                .collectList()
                .zipWith(forumPostRepository.countByTopicId(topicId))
                .map(tuple -> {
                    var posts = tuple.getT1();
                    var totalItems = tuple.getT2();
                    var pageInfo = calculatePageInfo(page, size, totalItems);
                    return ForumPostPageResponse.builder()
                            .items(posts)
                            .pageInfo(pageInfo)
                            .build();
                })
                .doOnSuccess(result -> log.info("Successfully retrieved forum posts for topic ID: {}", topicId))
                .doOnError(error -> log.error("Error finding forum posts for topic ID: {}", topicId, error));
    }

    public Mono<ForumPostDTO> createPost(CreateForumPostRequest request) {
        log.info("Creating forum post for topic ID: {}, author: {}", request.getTopicId(), request.getAuthorMemberId());
        
        // Validate topicId is valid (not 0 or negative)
        if (request.getTopicId() == null || request.getTopicId() <= 0) {
            log.warn("Invalid topic ID: {}", request.getTopicId());
            return Mono.error(new RuntimeException("Invalid topic ID: must be greater than 0"));
        }
        
        // Verify topic exists before creating post
        return forumTopicRepository.findById(request.getTopicId())
                .switchIfEmpty(Mono.defer(() -> {
                    log.error("Topic not found with ID: {}", request.getTopicId());
                    return Mono.error(new RuntimeException("Topic not found with ID: " + request.getTopicId()));
                }))
                .flatMap(topic -> {
                    ForumPost post = ForumPost.builder()
                            .topicId(request.getTopicId())
                            .authorMemberId(request.getAuthorMemberId())
                            .content(request.getContent())
                            .answerToPostId(request.getAnswerToPostId())
                            .isBanned(false)
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .build();
                    
                    return forumPostRepository.save(post);
                })
                .map(this::convertToPostDTO)
                .doOnSuccess(result -> log.info("Successfully created forum post with ID: {}", result.getId()))
                .doOnError(error -> log.error("Error creating forum post for topic ID: {}", request.getTopicId(), error));
    }

    public Mono<Void> banPost(Integer id) {
        log.info("Banning forum post ID: {}", id);
        return forumPostRepository.banPost(id)
                .then()
                .doOnSuccess(result -> log.info("Successfully banned forum post ID: {}", id))
                .doOnError(error -> log.error("Error banning forum post ID: {}", id, error));
    }

    public Mono<Void> unbanPost(Integer id) {
        log.info("Unbanning forum post ID: {}", id);
        return forumPostRepository.unbanPost(id)
                .then()
                .doOnSuccess(result -> log.info("Successfully unbanned forum post ID: {}", id))
                .doOnError(error -> log.error("Error unbanning forum post ID: {}", id, error));
    }

    public Mono<Void> deletePost(Integer id) {
        log.info("Deleting forum post ID: {}", id);
        return forumPostRepository.clearAnswerReferences(id)
                .flatMap(count -> {
                    if (count > 0) {
                        log.info("Cleared {} answer references for post ID: {}", count, id);
                    }
                    return forumPostRepository.deleteById(id);
                })
                .doOnSuccess(result -> log.info("Successfully deleted forum post ID: {}", id))
                .doOnError(error -> log.error("Error deleting forum post ID: {}", id, error));
    }

    public Mono<ForumPostDTO> answerToPost(Integer postId, CreateForumPostRequest request) {
        log.info("Creating answer to post ID: {}", postId);
        request.setAnswerToPostId(postId);
        return createPost(request)
                .map(result -> {
                    result.setAnswerToPostId(postId);
                    return result;
                })
                .doOnSuccess(result -> log.info("Successfully created answer to post ID: {}", postId))
                .doOnError(error -> log.error("Error creating answer to post ID: {}", postId, error));
    }

    // ========== REACTION METHODS (LIKE/DISLIKE) ==========

    /**
     * Like or unlike a forum post (toggle)
     */
    public Mono<ForumPostReactionDTO> reactToPost(CreateForumPostReactionRequest request) {
        log.info("Adding/removing like to post ID: {}, member: {}", 
                request.getPostId(), request.getMemberId());
        
        // Validate post exists
        return forumPostRepository.findById(request.getPostId())
                .switchIfEmpty(Mono.defer(() -> {
                    log.error("Post not found with ID: {}", request.getPostId());
                    return Mono.error(new RuntimeException("Post not found with ID: " + request.getPostId()));
                }))
                .flatMap(post -> {
                    // Check if reaction already exists
                    return forumPostReactionRepository.findByPostIdAndMemberId(
                            request.getPostId(), request.getMemberId())
                            .flatMap(existingReaction -> {
                                // If reaction exists, remove it (unlike)
                                log.info("Removing existing like from post ID: {}, member: {}", 
                                        request.getPostId(), request.getMemberId());
                                return forumPostReactionRepository.deleteByPostIdAndMemberId(
                                        request.getPostId(), request.getMemberId())
                                        .then(Mono.<ForumPostReaction>error(new RuntimeException("REACTION_REMOVED")));
                            })
                            .switchIfEmpty(Mono.defer(() -> {
                                // No existing reaction, create new one (like)
                                log.info("Creating new like for post ID: {}, member: {}", 
                                        request.getPostId(), request.getMemberId());
                                ForumPostReaction reaction = ForumPostReaction.builder()
                                        .postId(request.getPostId())
                                        .memberId(request.getMemberId())
                                        .createdAt(LocalDateTime.now())
                                        .build();
                                return forumPostReactionRepository.save(reaction);
                            }));
                })
                .map(this::convertToReactionDTO)
                .doOnSuccess(result -> log.info("Successfully toggled like for post ID: {}", request.getPostId()))
                .doOnError(error -> {
                    if (!"REACTION_REMOVED".equals(error.getMessage())) {
                        log.error("Error toggling like for post ID: {}", request.getPostId(), error);
                    }
                });
    }

    /**
     * Get like count for a post
     */
    public Mono<java.util.Map<String, Long>> getPostReactionCounts(Integer postId) {
        log.info("Getting like count for post ID: {}", postId);
        
        return forumPostReactionRepository.countReactionsByPostId(postId)
                .map(count -> {
                    java.util.Map<String, Long> map = new java.util.HashMap<>();
                    map.put("likes", count);
                    return map;
                })
                .doOnSuccess(result -> log.info("Retrieved like count for post ID: {}", postId))
                .doOnError(error -> log.error("Error getting like count for post ID: {}", postId, error));
    }

    /**
     * Get user's reaction for a specific post
     */
    public Mono<ForumPostReactionDTO> getUserReaction(Integer postId, Integer memberId) {
        log.info("Getting user reaction for post ID: {}, member: {}", postId, memberId);
        return forumPostReactionRepository.findByPostIdAndMemberId(postId, memberId)
                .map(this::convertToReactionDTO)
                .doOnSuccess(result -> log.info("Found user reaction for post ID: {}", postId))
                .doOnError(error -> log.debug("No reaction found for post ID: {} by member: {}", postId, memberId));
    }

    // Helper methods to convert entities to DTOs
    private ForumCategoryDTO convertToCategoryDTO(ForumCategory category) {
        return ForumCategoryDTO.builder()
                .id(category.getId())
                .organizationId(category.getOrganizationId())
                .name(category.getName())
                .description(category.getDescription())
                .createdAt(category.getCreatedAt())
                .updatedAt(category.getUpdatedAt())
                .build();
    }

    private ForumTopicDTO convertToTopicDTO(ForumTopic topic) {
        return ForumTopicDTO.builder()
                .id(topic.getId())
                .organizationId(topic.getOrganizationId())
                .title(topic.getTitle())
                .createdByMemberId(topic.getCreatedByMemberId())
                .categoryId(topic.getCategoryId())
                .viewCount(topic.getViewCount())
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
                .isLike(isLike)
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
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

