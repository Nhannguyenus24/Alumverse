package com.service.backend.admin.repository;

import com.service.backend.forum.entities.ForumCategory;
import com.service.backend.forum.entities.ForumTopic;
import com.service.backend.forum.entities.ForumPost;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Admin-specific repository for forum operations combining categories, topics, and posts
 */
public interface AdminForumRepository {
    
    // ========== CATEGORY QUERIES ==========
    
    /**
     * Count categories by organization
     */
    Mono<Long> countCategoriesByOrganization(Integer organizationId);
    
    /**
     * Find all categories by organization with pagination
     */
    Flux<ForumCategory> findCategoriesByOrganization(Integer organizationId);
    
    /**
     * Find all categories
     */
    Flux<ForumCategory> findAllCategories();
    
    /**
     * Find category by id
     */
    Mono<ForumCategory> findCategoryById(Integer categoryId);
    
    /**
     * Save or update category
     */
    Mono<ForumCategory> saveCategory(ForumCategory category);
    
    // ========== TOPIC QUERIES ==========
    
    /**
     * Count topics by organization
     */
    Mono<Long> countTopicsByOrganization(Integer organizationId);
    
    /**
     * Count topics by category
     */
    Mono<Long> countTopicsByCategory(Integer categoryId);
    
    /**
     * Find all topics by organization
     */
    Flux<ForumTopic> findTopicsByOrganization(Integer organizationId);
    
    /**
     * Find all topics by category
     */
    Flux<ForumTopic> findTopicsByCategory(Integer categoryId);
    
    /**
     * Find all topics
     */
    Flux<ForumTopic> findAllTopics();
    
    /**
     * Find topic by id
     */
    Mono<ForumTopic> findTopicById(Integer topicId);
    
    /**
     * Save or update topic
     */
    Mono<ForumTopic> saveTopic(ForumTopic topic);
    
    // ========== POST QUERIES ==========
    
    /**
     * Count posts by organization
     */
    Mono<Long> countPostsByOrganization(Integer organizationId);
    
    /**
     * Count posts by category
     */
    Mono<Long> countPostsByCategory(Integer categoryId);
    
    /**
     * Count posts by topic
     */
    Mono<Long> countPostsByTopic(Integer topicId);
    
    /**
     * Find all posts by topic
     */
    Flux<ForumPost> findPostsByTopic(Integer topicId);
    
    /**
     * Find all posts by category
     */
    Flux<ForumPost> findPostsByCategory(Integer categoryId);
    
    /**
     * Find all posts by organization
     */
    Flux<ForumPost> findPostsByOrganization(Integer organizationId);
    
    /**
     * Find all posts
     */
    Flux<ForumPost> findAllPosts();
    
    /**
     * Find post by id
     */
    Mono<ForumPost> findPostById(Integer postId);
    
    /**
     * Save or update post
     */
    Mono<ForumPost> savePost(ForumPost post);
    
    /**
     * Delete post
     */
    Mono<Void> deletePost(ForumPost post);
    
    /**
     * Find posts by user (author)
     */
    Flux<ForumPost> findPostsByUser(Integer userId);
    
    /**
     * Find banned posts
     */
    Flux<ForumPost> findBannedPosts();
}
