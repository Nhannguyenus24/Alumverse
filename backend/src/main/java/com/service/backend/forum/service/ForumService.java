package com.service.backend.forum.service;

import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.service.backend.forum.dto.CreateForumCategoryRequest;
import com.service.backend.forum.dto.CreateForumPostRequest;
import com.service.backend.forum.dto.CreateForumTopicRequest;
import com.service.backend.forum.dto.ForumCategoryDTO;
import com.service.backend.forum.dto.ForumPostDTO;
import com.service.backend.forum.dto.ForumTopicDTO;
import com.service.backend.forum.dto.UpdateForumCategoryRequest;
import com.service.backend.forum.dto.UpdateForumTopicRequest;
import com.service.backend.forum.entities.ForumCategory;
import com.service.backend.forum.entities.ForumPost;
import com.service.backend.forum.entities.ForumTopic;
import com.service.backend.forum.repository.ForumCategoryRepository;
import com.service.backend.forum.repository.ForumPostRepository;
import com.service.backend.forum.repository.ForumTopicRepository;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
public class ForumService {
    private static final Logger log = LoggerFactory.getLogger(ForumService.class);

    private final ForumCategoryRepository forumCategoryRepository;
    private final ForumTopicRepository forumTopicRepository;
    private final ForumPostRepository forumPostRepository;

    public ForumService(ForumCategoryRepository forumCategoryRepository,
                        ForumTopicRepository forumTopicRepository,
                        ForumPostRepository forumPostRepository) {
        this.forumCategoryRepository = forumCategoryRepository;
        this.forumTopicRepository = forumTopicRepository;
        this.forumPostRepository = forumPostRepository;
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

    public Flux<ForumTopicDTO> findTopicsByCategoryId(Integer categoryId, int page, int size) {
        log.info("Finding forum topics for category ID: {}, page: {}, size: {}", categoryId, page, size);
        long offset = (long) page * size;
        return forumTopicRepository.findByCategoryIdWithPagination(categoryId, size, offset)
                .map(this::convertToTopicDTO)
                .doOnComplete(() -> log.info("Successfully retrieved forum topics for category ID: {}", categoryId))
                .doOnError(error -> log.error("Error finding forum topics for category ID: {}", categoryId, error));
    }

    public Mono<ForumTopicDTO> createTopic(CreateForumTopicRequest request) {
        log.info("Creating forum topic: {}", request.getTitle());
        ForumTopic topic = ForumTopic.builder()
                .organizationId(request.getOrganizationId())
                .title(request.getTitle())
                .createdByMemberId(request.getCreatedByMemberId())
                .categoryId(request.getCategoryId())
                .viewCount(0)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        
        return forumTopicRepository.save(topic)
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
    public Flux<ForumPostDTO> findPostsByTopicId(Integer topicId, int page, int size) {
        log.info("Finding forum posts for topic ID: {}, page: {}, size: {}", topicId, page, size);
        
        // Fire and forget: increment view count for topic
        forumTopicRepository.incrementViewCount(topicId)
                .doOnSuccess(count -> log.debug("Incremented view count for topic ID: {}", topicId))
                .doOnError(error -> log.warn("Failed to increment view count for topic ID: {}", topicId, error))
                .subscribe();
        
        long offset = (long) page * size;
        return forumPostRepository.findByTopicIdWithPagination(topicId, size, offset)
                .map(this::convertToPostDTO)
                .doOnComplete(() -> log.info("Successfully retrieved forum posts for topic ID: {}", topicId))
                .doOnError(error -> log.error("Error finding forum posts for topic ID: {}", topicId, error));
    }

    public Mono<ForumPostDTO> createPost(CreateForumPostRequest request) {
        log.info("Creating forum post for topic ID: {}, author: {}", request.getTopicId(), request.getAuthorMemberId());
        ForumPost post = ForumPost.builder()
                .topicId(request.getTopicId())
                .authorMemberId(request.getAuthorMemberId())
                .content(request.getContent())
                .answerToPostId(request.getAnswerToPostId())
                .isBanned(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        
        return forumPostRepository.save(post)
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
        return forumPostRepository.deleteById(id)
                .doOnSuccess(result -> log.info("Successfully deleted forum post ID: {}", id))
                .doOnError(error -> log.error("Error deleting forum post ID: {}", id, error));
    }

    public Mono<ForumPostDTO> answerToPost(Integer postId, CreateForumPostRequest request) {
        log.info("Creating answer to post ID: {}", postId);
        request.setAnswerToPostId(postId);
        return createPost(request)
                .doOnSuccess(result -> log.info("Successfully created answer to post ID: {}", postId))
                .doOnError(error -> log.error("Error creating answer to post ID: {}", postId, error));
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
        return ForumPostDTO.builder()
                .id(post.getId())
                .topicId(post.getTopicId())
                .authorMemberId(post.getAuthorMemberId())
                .content(post.getContent())
                .answerToPostId(post.getAnswerToPostId())
                .isBanned(post.getIsBanned())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }
}

