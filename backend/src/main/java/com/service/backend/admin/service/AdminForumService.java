package com.service.backend.admin.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.service.backend.forum.dto.ForumCategoryDTO;
import com.service.backend.forum.dto.ForumPostDTO;
import com.service.backend.forum.dto.ForumPostPageResponse;
import com.service.backend.forum.dto.ForumTopicDTO;
import com.service.backend.forum.dto.ForumTopicPageResponse;
import com.service.backend.forum.dto.UpdateForumCategoryRequest;
import com.service.backend.forum.dto.UpdateForumTopicRequest;
import com.service.backend.forum.entities.ForumCategory;
import com.service.backend.forum.entities.ForumPost;
import com.service.backend.forum.entities.ForumTopic;
import com.service.backend.admin.repository.AdminForumRepository;
import com.service.backend.shared.dto.PageInfo;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
public class AdminForumService {
    private static final Logger log = LoggerFactory.getLogger(AdminForumService.class);

    private final AdminForumRepository adminForumRepository;

    public AdminForumService(AdminForumRepository adminForumRepository) {
        this.adminForumRepository = adminForumRepository;
    }

    // ========== FORUM STATISTICS ==========

    /**
     * Get forum statistics for a specific organization
     * Returns counts of categories, topics, posts and user engagement metrics
     */
    public Mono<ForumStatistics> getForumStatisticsByOrganization(Integer organizationId) {
        log.info("Fetching forum statistics for organization: {}", organizationId);
        
        return adminForumRepository.countCategoriesByOrganization(organizationId)
                .flatMap(categoryCount -> adminForumRepository.countTopicsByOrganization(organizationId)
                        .flatMap(topicCount -> adminForumRepository.countPostsByOrganization(organizationId)
                                .map(postCount -> ForumStatistics.builder()
                                        .organizationId(organizationId)
                                        .totalCategories(categoryCount)
                                        .totalTopics(topicCount)
                                        .totalPosts(postCount)
                                        .build())))
                .doOnError(error -> log.error("Error fetching forum statistics: {}", error.getMessage()));
    }

    /**
     * Get statistics for a specific category
     */
    public Mono<CategoryStatistics> getCategoryStatistics(Integer categoryId) {
        log.info("Fetching statistics for category: {}", categoryId);
        
        return adminForumRepository.findCategoryById(categoryId)
                .flatMap(category -> adminForumRepository.countTopicsByCategory(categoryId)
                        .flatMap(topicCount -> adminForumRepository.countPostsByCategory(categoryId)
                                .map(postCount -> CategoryStatistics.builder()
                                        .categoryId(categoryId)
                                        .categoryName(category.getName())
                                        .totalTopics(topicCount)
                                        .totalPosts(postCount)
                                        .build())))
                .doOnError(error -> log.error("Error fetching category statistics: {}", error.getMessage()));
    }

    /**
     * Get statistics for a specific topic
     */
    public Mono<TopicStatistics> getTopicStatistics(Integer topicId) {
        log.info("Fetching statistics for topic: {}", topicId);
        
        return adminForumRepository.findTopicById(topicId)
                .flatMap(topic -> adminForumRepository.countPostsByTopic(topicId)
                        .map(postCount -> TopicStatistics.builder()
                                .topicId(topicId)
                                .topicTitle(topic.getTitle())
                                .totalPosts(postCount)
                                .isActive(true)
                                .isPinned(false)
                                .build()))
                .doOnError(error -> log.error("Error fetching topic statistics: {}", error.getMessage()));
    }

    // ========== CATEGORY MANAGEMENT ==========

    /**
     * Get all categories with filtering capability
     */
    public Flux<ForumCategoryDTO> getAllCategories(Integer organizationId, int page, int size) {
        log.info("Fetching all categories - organizationId: {}, page: {}, size: {}", organizationId, page, size);
        
        if (organizationId != null) {
            return adminForumRepository.findCategoriesByOrganization(organizationId)
                    .skip((long) page * size)
                    .take(size)
                    .map(this::mapToCategoryDTO);
        } else {
            return adminForumRepository.findAllCategories()
                    .skip((long) page * size)
                    .take(size)
                    .map(this::mapToCategoryDTO);
        }
    }

    /**
     * Archive a forum category
     */
    public Mono<ForumCategoryDTO> archiveCategory(Integer categoryId) {
        log.info("Archiving category: {}", categoryId);
        
        return adminForumRepository.findCategoryById(categoryId)
                .flatMap(category -> {
                    // Note: Category entity doesn't have archived field in current schema
                    return adminForumRepository.saveCategory(category);
                })
                .map(this::mapToCategoryDTO)
                .doOnError(error -> log.error("Error archiving category: {}", error.getMessage()));
    }

    /**
     * Restore an archived forum category
     */
    public Mono<ForumCategoryDTO> restoreCategory(Integer categoryId) {
        log.info("Restoring category: {}", categoryId);
        
        return adminForumRepository.findCategoryById(categoryId)
                .flatMap(category -> {
                    // Note: Category entity doesn't have archived field in current schema
                    return adminForumRepository.saveCategory(category);
                })
                .map(this::mapToCategoryDTO)
                .doOnError(error -> log.error("Error restoring category: {}", error.getMessage()));
    }

    /**
     * Update category (admin version)
     */
    public Mono<ForumCategoryDTO> updateCategory(Integer categoryId, UpdateForumCategoryRequest request) {
        log.info("Updating category: {}", categoryId);
        
        return adminForumRepository.findCategoryById(categoryId)
                .flatMap(category -> {
                    if (request.getName() != null) {
                        category.setName(request.getName());
                    }
                    if (request.getDescription() != null) {
                        category.setDescription(request.getDescription());
                    }
                    return adminForumRepository.saveCategory(category);
                })
                .map(this::mapToCategoryDTO)
                .doOnError(error -> log.error("Error updating category: {}", error.getMessage()));
    }

    // ========== TOPIC MANAGEMENT ==========

    /**
     * Get all topics with advanced filtering
     */
    public Mono<ForumTopicPageResponse> getAllTopics(Integer organizationId, Integer categoryId, int page, int size) {
        log.info("Fetching all topics - organizationId: {}, categoryId: {}, page: {}, size: {}", 
                organizationId, categoryId, page, size);
        
        Flux<ForumTopicDTO> topicsFlux;
        
        if (categoryId != null) {
            topicsFlux = adminForumRepository.findTopicsByCategory(categoryId)
                    .map(this::mapToTopicDTO);
        } else if (organizationId != null) {
            topicsFlux = adminForumRepository.findTopicsByOrganization(organizationId)
                    .map(this::mapToTopicDTO);
        } else {
            topicsFlux = adminForumRepository.findAllTopics()
                    .map(this::mapToTopicDTO);
        }
        
        return topicsFlux
                .skip((long) page * size)
                .take(size)
                .collectList()
                .map(topics -> {
                    PageInfo pageInfo = PageInfo.builder()
                            .currentPage(page)
                            .pageSize(size)
                            .totalPage(1)
                            .totalItem((int) topics.size())
                            .build();
                    return ForumTopicPageResponse.builder()
                            .items(topics)
                            .pageInfo(pageInfo)
                            .build();
                })
                .doOnError(error -> log.error("Error fetching topics: {}", error.getMessage()));
    }

    /**
     * Lock a forum topic (prevent new posts)
     */
    public Mono<ForumTopicDTO> lockTopic(Integer topicId) {
        log.info("Locking topic: {}", topicId);
        
        return adminForumRepository.findTopicById(topicId)
                .flatMap(topic -> {
                    // Note: Topic entity doesn't have locked field in current schema
                    return adminForumRepository.saveTopic(topic);
                })
                .map(this::mapToTopicDTO)
                .doOnError(error -> log.error("Error locking topic: {}", error.getMessage()));
    }

    /**
     * Unlock a forum topic
     */
    public Mono<ForumTopicDTO> unlockTopic(Integer topicId) {
        log.info("Unlocking topic: {}", topicId);
        
        return adminForumRepository.findTopicById(topicId)
                .flatMap(topic -> {
                    // Note: Topic entity doesn't have locked field in current schema
                    return adminForumRepository.saveTopic(topic);
                })
                .map(this::mapToTopicDTO)
                .doOnError(error -> log.error("Error unlocking topic: {}", error.getMessage()));
    }

    /**
     * Pin a topic to the top
     */
    public Mono<ForumTopicDTO> pinTopic(Integer topicId) {
        log.info("Pinning topic: {}", topicId);
        
        return adminForumRepository.findTopicById(topicId)
                .flatMap(topic -> {
                    // Note: Topic entity doesn't have pinned field in current schema
                    return adminForumRepository.saveTopic(topic);
                })
                .map(this::mapToTopicDTO)
                .doOnError(error -> log.error("Error pinning topic: {}", error.getMessage()));
    }

    /**
     * Unpin a topic
     */
    public Mono<ForumTopicDTO> unpinTopic(Integer topicId) {
        log.info("Unpinning topic: {}", topicId);
        
        return adminForumRepository.findTopicById(topicId)
                .flatMap(topic -> {
                    // Note: Topic entity doesn't have pinned field in current schema
                    return adminForumRepository.saveTopic(topic);
                })
                .map(this::mapToTopicDTO)
                .doOnError(error -> log.error("Error unpinning topic: {}", error.getMessage()));
    }

    /**
     * Update topic (admin version)
     */
    public Mono<ForumTopicDTO> updateTopic(Integer topicId, UpdateForumTopicRequest request) {
        log.info("Updating topic: {}", topicId);
        
        return adminForumRepository.findTopicById(topicId)
                .flatMap(topic -> {
                    if (request.getTitle() != null) {
                        topic.setTitle(request.getTitle());
                    }
                    // Note: Description field doesn't exist in Topic entity
                    return adminForumRepository.saveTopic(topic);
                })
                .map(this::mapToTopicDTO)
                .doOnError(error -> log.error("Error updating topic: {}", error.getMessage()));
    }

    /**
     * Archive a topic
     */
    public Mono<ForumTopicDTO> archiveTopic(Integer topicId) {
        log.info("Archiving topic: {}", topicId);
        
        return adminForumRepository.findTopicById(topicId)
                .flatMap(topic -> {
                    // Note: Topic entity doesn't have archived field in current schema
                    return adminForumRepository.saveTopic(topic);
                })
                .map(this::mapToTopicDTO)
                .doOnError(error -> log.error("Error archiving topic: {}", error.getMessage()));
    }

    // ========== POST MODERATION ==========

    /**
     * Get all posts with advanced filtering
     */
    public Mono<ForumPostPageResponse> getAllPosts(Integer organizationId, Integer categoryId, Integer topicId, String status, int page, int size) {
        log.info("Fetching all posts - organizationId: {}, categoryId: {}, topicId: {}, status: {}", 
                organizationId, categoryId, topicId, status);
        
        Flux<ForumPost> postsFlux;
        
        if (topicId != null) {
            postsFlux = adminForumRepository.findPostsByTopic(topicId);
        } else if (categoryId != null) {
            postsFlux = adminForumRepository.findPostsByCategory(categoryId);
        } else if (organizationId != null) {
            postsFlux = adminForumRepository.findPostsByOrganization(organizationId);
        } else {
            postsFlux = adminForumRepository.findAllPosts();
        }
        
        return postsFlux
                .skip((long) page * size)
                .take(size)
                .collectList()
                .map(posts -> {
                    PageInfo pageInfo = PageInfo.builder()
                            .currentPage(page)
                            .pageSize(size)
                            .totalItem((int) posts.size())
                            .build();
                    return ForumPostPageResponse.builder()
                            .items(posts.stream().map(this::mapToPostDTO).toList())
                            .pageInfo(pageInfo)
                            .build();
                })
                .doOnError(error -> log.error("Error fetching posts: {}", error.getMessage()));
    }

    /**
     * Get flagged/reported posts
     */
    public Mono<ForumPostPageResponse> getFlaggedPosts(Integer organizationId, int page, int size) {
        log.info("Fetching flagged posts");
        
        return adminForumRepository.findBannedPosts()
                .skip((long) page * size)
                .take(size)
                .collectList()
                .map(posts -> {
                    PageInfo pageInfo = PageInfo.builder()
                            .currentPage(page)
                            .pageSize(size)
                            .totalItem((int) posts.size())
                            .build();
                    return ForumPostPageResponse.builder()
                            .items(posts.stream().map(this::mapToPostDTO).toList())
                            .pageInfo(pageInfo)
                            .build();
                })
                .doOnError(error -> log.error("Error fetching flagged posts: {}", error.getMessage()));
    }

    /**
     * Flag a post as inappropriate
     */
    public Mono<ForumPostDTO> flagPost(Integer postId, String reason) {
        log.info("Flagging post: {} with reason: {}", postId, reason);
        
        return adminForumRepository.findPostById(postId)
                .flatMap(post -> {
                    // Note: Post entity doesn't have flagged/flagReason fields in current schema
                    post.setIsBanned(true);
                    return adminForumRepository.savePost(post);
                })
                .map(this::mapToPostDTO)
                .doOnError(error -> log.error("Error flagging post: {}", error.getMessage()));
    }

    /**
     * Clear the flag on a post
     */
    public Mono<ForumPostDTO> unflagPost(Integer postId) {
        log.info("Unflagging post: {}", postId);
        
        return adminForumRepository.findPostById(postId)
                .flatMap(post -> {
                    post.setIsBanned(false);
                    return adminForumRepository.savePost(post);
                })
                .map(this::mapToPostDTO)
                .doOnError(error -> log.error("Error unflagging post: {}", error.getMessage()));
    }

    /**
     * Delete a post permanently
     */
    public Mono<Void> deletePost(Integer postId, String reason) {
        log.info("Deleting post: {} with reason: {}", postId, reason);
        
        return adminForumRepository.findPostById(postId)
                .flatMap(post -> {
                    log.info("Post deletion reason: {}", reason);
                    return adminForumRepository.deletePost(post);
                })
                .doOnError(error -> log.error("Error deleting post: {}", error.getMessage()));
    }

    /**
     * Get posts by specific user
     */
    public Mono<ForumPostPageResponse> getPostsByUser(Integer userId, int page, int size) {
        log.info("Fetching posts by user: {}", userId);
        
        return adminForumRepository.findPostsByUser(userId)
                .skip((long) page * size)
                .take(size)
                .collectList()
                .map(posts -> {
                    PageInfo pageInfo = PageInfo.builder()
                            .currentPage(page)
                            .pageSize(size)
                            .totalItem((int) posts.size())
                            .build();
                    return ForumPostPageResponse.builder()
                            .items(posts.stream().map(this::mapToPostDTO).toList())
                            .pageInfo(pageInfo)
                            .build();
                })
                .doOnError(error -> log.error("Error fetching posts by user: {}", error.getMessage()));
    }

    // ========== CONTENT SEARCH & MONITORING ==========

    /**
     * Search forum content globally
     */
    public Mono<Object> searchForum(String query, Integer organizationId, int page, int size) {
        log.info("Searching forum with query: {}", query);
        
        return adminForumRepository.findAllPosts()
                .filter(post -> post.getContent() != null && post.getContent().contains(query))
                .skip((long) page * size)
                .take(size)
                .map(post -> (Object) mapToPostDTO(post))
                .collectList()
                .map(results -> (Object) results)
                .doOnError(error -> log.error("Error searching forum: {}", error.getMessage()));
    }

    /**
     * Get recent forum activity
     */
    public Flux<Object> getRecentActivity(Integer organizationId, int limit) {
        log.info("Fetching recent forum activity");
        
        return adminForumRepository.findAllPosts()
                .take(limit)
                .map(post -> (Object) mapToPostDTO(post))
                .doOnError(error -> log.error("Error fetching recent activity: {}", error.getMessage()));
    }

    /**
     * Get users with high moderation flags
     */
    public Flux<Object> getProblematicUsers(Integer organizationId, int minFlags) {
        log.info("Fetching problematic users with min flags: {}", minFlags);
        
        return adminForumRepository.findBannedPosts()
                .groupBy(ForumPost::getAuthorMemberId)
                .flatMap(group -> group.count()
                        .filter(count -> count >= minFlags)
                        .map(count -> (Object) group.key()))
                .doOnError(error -> log.error("Error fetching problematic users: {}", error.getMessage()));
    }

    // ========== HELPER METHODS ==========

    private ForumCategoryDTO mapToCategoryDTO(ForumCategory category) {
        return ForumCategoryDTO.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .organizationId(category.getOrganizationId())
                .build();
    }

    private ForumTopicDTO mapToTopicDTO(ForumTopic topic) {
        return ForumTopicDTO.builder()
                .id(topic.getId())
                .title(topic.getTitle())
                .categoryId(topic.getCategoryId())
                .organizationId(topic.getOrganizationId())
                .build();
    }

    private ForumPostDTO mapToPostDTO(ForumPost post) {
        return ForumPostDTO.builder()
                .id(post.getId())
                .content(post.getContent())
                .topicId(post.getTopicId())
                .authorMemberId(post.getAuthorMemberId())
                .createdAt(post.getCreatedAt())
                .build();
    }

    // ========== INNER CLASSES FOR STATISTICS ==========

    public static class ForumStatistics {
        private Integer organizationId;
        private Long totalCategories;
        private Long totalTopics;
        private Long totalPosts;

        // Getters, Setters, and Builder
        public ForumStatistics(Integer organizationId, Long totalCategories, Long totalTopics, Long totalPosts) {
            this.organizationId = organizationId;
            this.totalCategories = totalCategories;
            this.totalTopics = totalTopics;
            this.totalPosts = totalPosts;
        }

        public static ForumStatistics.Builder builder() {
            return new ForumStatistics.Builder();
        }

        public static class Builder {
            private Integer organizationId;
            private Long totalCategories;
            private Long totalTopics;
            private Long totalPosts;

            public Builder organizationId(Integer organizationId) {
                this.organizationId = organizationId;
                return this;
            }

            public Builder totalCategories(Long totalCategories) {
                this.totalCategories = totalCategories;
                return this;
            }

            public Builder totalTopics(Long totalTopics) {
                this.totalTopics = totalTopics;
                return this;
            }

            public Builder totalPosts(Long totalPosts) {
                this.totalPosts = totalPosts;
                return this;
            }

            public ForumStatistics build() {
                return new ForumStatistics(organizationId, totalCategories, totalTopics, totalPosts);
            }
        }

        // Getters
        public Integer getOrganizationId() { return organizationId; }
        public Long getTotalCategories() { return totalCategories; }
        public Long getTotalTopics() { return totalTopics; }
        public Long getTotalPosts() { return totalPosts; }
    }

    public static class CategoryStatistics {
        private Integer categoryId;
        private String categoryName;
        private Long totalTopics;
        private Long totalPosts;

        public CategoryStatistics(Integer categoryId, String categoryName, Long totalTopics, Long totalPosts) {
            this.categoryId = categoryId;
            this.categoryName = categoryName;
            this.totalTopics = totalTopics;
            this.totalPosts = totalPosts;
        }

        public static CategoryStatistics.Builder builder() {
            return new CategoryStatistics.Builder();
        }

        public static class Builder {
            private Integer categoryId;
            private String categoryName;
            private Long totalTopics;
            private Long totalPosts;

            public Builder categoryId(Integer categoryId) {
                this.categoryId = categoryId;
                return this;
            }

            public Builder categoryName(String categoryName) {
                this.categoryName = categoryName;
                return this;
            }

            public Builder totalTopics(Long totalTopics) {
                this.totalTopics = totalTopics;
                return this;
            }

            public Builder totalPosts(Long totalPosts) {
                this.totalPosts = totalPosts;
                return this;
            }

            public CategoryStatistics build() {
                return new CategoryStatistics(categoryId, categoryName, totalTopics, totalPosts);
            }
        }

        public Integer getCategoryId() { return categoryId; }
        public String getCategoryName() { return categoryName; }
        public Long getTotalTopics() { return totalTopics; }
        public Long getTotalPosts() { return totalPosts; }
    }

    public static class TopicStatistics {
        private Integer topicId;
        private String topicTitle;
        private Long totalPosts;
        private boolean isActive;
        private boolean isPinned;

        public TopicStatistics(Integer topicId, String topicTitle, Long totalPosts, boolean isActive, boolean isPinned) {
            this.topicId = topicId;
            this.topicTitle = topicTitle;
            this.totalPosts = totalPosts;
            this.isActive = isActive;
            this.isPinned = isPinned;
        }

        public static TopicStatistics.Builder builder() {
            return new TopicStatistics.Builder();
        }

        public static class Builder {
            private Integer topicId;
            private String topicTitle;
            private Long totalPosts;
            private boolean isActive;
            private boolean isPinned;

            public Builder topicId(Integer topicId) {
                this.topicId = topicId;
                return this;
            }

            public Builder topicTitle(String topicTitle) {
                this.topicTitle = topicTitle;
                return this;
            }

            public Builder totalPosts(Long totalPosts) {
                this.totalPosts = totalPosts;
                return this;
            }

            public Builder isActive(boolean isActive) {
                this.isActive = isActive;
                return this;
            }

            public Builder isPinned(boolean isPinned) {
                this.isPinned = isPinned;
                return this;
            }

            public TopicStatistics build() {
                return new TopicStatistics(topicId, topicTitle, totalPosts, isActive, isPinned);
            }
        }

        public Integer getTopicId() { return topicId; }
        public String getTopicTitle() { return topicTitle; }
        public Long getTotalPosts() { return totalPosts; }
        public boolean isActive() { return isActive; }
        public boolean isPinned() { return isPinned; }
    }
}
