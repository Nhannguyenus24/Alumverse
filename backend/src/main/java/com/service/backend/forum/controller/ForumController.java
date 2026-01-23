package com.service.backend.forum.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.service.backend.forum.dto.CreateForumCategoryRequest;
import com.service.backend.forum.dto.CreateForumPostRequest;
import com.service.backend.forum.dto.CreateForumTopicRequest;
import com.service.backend.forum.dto.ForumCategoryDTO;
import com.service.backend.forum.dto.ForumPostDTO;
import com.service.backend.forum.dto.ForumTopicDTO;
import com.service.backend.forum.dto.UpdateForumCategoryRequest;
import com.service.backend.forum.dto.UpdateForumTopicRequest;
import com.service.backend.forum.service.ForumService;
import com.service.backend.shared.dto.ApiResponse;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/forum")
@Validated
public class ForumController {
    private final ForumService forumService;

    public ForumController(ForumService forumService) {
        this.forumService = forumService;
    }

    // ========== CATEGORY ENDPOINTS ==========

    /**
     * Find all forum categories by organization id
     */
    @GetMapping("/category")
    public Mono<ApiResponse<List<ForumCategoryDTO>>> getAllCategoriesByOrganization(
            @RequestParam @NotNull(message = "Organization ID is required") Integer organizationId) {
        return forumService.findAllCategoriesByOrganizationId(organizationId)
                .collectList()
                .map(categories -> new ApiResponse<>("Categories retrieved successfully", categories))
                .onErrorResume(error -> Mono.just(new ApiResponse<>(error.getMessage(), null)));
    }

    /**
     * Create forum category
     */
    @PostMapping("/category")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ApiResponse<ForumCategoryDTO>> createCategory(
            @Valid @RequestBody CreateForumCategoryRequest request) {
        return forumService.createCategory(request)
                .map(category -> new ApiResponse<>("Forum category created successfully", category))
                .onErrorResume(error -> Mono.just(new ApiResponse<>(error.getMessage(), null)));
    }

    /**
     * Update forum category
     */
    @PutMapping("/category/{id}")
    public Mono<ApiResponse<ForumCategoryDTO>> updateCategory(
            @PathVariable @Min(value = 1, message = "Category ID must be greater than 0") Integer id,
            @Valid @RequestBody UpdateForumCategoryRequest request) {
        return forumService.updateCategory(id, request)
                .map(category -> new ApiResponse<>("Forum category updated successfully", category))
                .onErrorResume(error -> Mono.just(new ApiResponse<>(error.getMessage(), null)));
    }

    /**
     * Delete forum category
     */
    @DeleteMapping("/category/{id}")
    public Mono<ApiResponse<Object>> deleteCategory(
            @PathVariable @Min(value = 1, message = "Category ID must be greater than 0") Integer id) {
        return forumService.deleteCategory(id)
                .then(Mono.just(new ApiResponse<>("Forum category deleted successfully", null)))
                .onErrorResume(error -> Mono.just(new ApiResponse<>(error.getMessage(), null)));
    }

    // ========== TOPIC ENDPOINTS ==========

    /**
     * Find forum topic by title
     */
    @GetMapping("/topic/search")
    public Mono<ApiResponse<ForumTopicDTO>> getTopicByTitle(@RequestParam String title) {
        return forumService.findTopicByTitle(title)
                .map(topic -> new ApiResponse<>("Topic found successfully", topic))
                .onErrorResume(error -> Mono.just(new ApiResponse<>(error.getMessage(), null)));
    }

    /**
     * Find forum topics by category id with pagination
     */
    @GetMapping("/topic")
    public Mono<ApiResponse<List<ForumTopicDTO>>> getTopicsByCategoryId(
            @RequestParam Integer categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return forumService.findTopicsByCategoryId(categoryId, page, size)
                .collectList()
                .map(topics -> new ApiResponse<>("Topics retrieved successfully", topics))
                .onErrorResume(error -> Mono.just(new ApiResponse<>(error.getMessage(), null)));
    }

    /**
     * Create forum topic
     */
    @PostMapping("/topic")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ApiResponse<ForumTopicDTO>> createTopic(
            @Valid @RequestBody CreateForumTopicRequest request) {
        return forumService.createTopic(request)
                .map(topic -> new ApiResponse<>("Forum topic created successfully", topic))
                .onErrorResume(error -> Mono.just(new ApiResponse<>(error.getMessage(), null)));
    }

    /**
     * Update forum topic by id
     */
    @PutMapping("/topic/{id}")
    public Mono<ApiResponse<ForumTopicDTO>> updateTopic(
            @PathVariable @Min(value = 1, message = "Topic ID must be greater than 0") Integer id,
            @Valid @RequestBody UpdateForumTopicRequest request) {
        return forumService.updateTopic(id, request)
                .map(topic -> new ApiResponse<>("Forum topic updated successfully", topic))
                .onErrorResume(error -> Mono.just(new ApiResponse<>(error.getMessage(), null)));
    }

    /**
     * Delete forum topic by id
     */
    @DeleteMapping("/topic/{id}")
    public Mono<ApiResponse<Object>> deleteTopic(
            @PathVariable @Min(value = 1, message = "Topic ID must be greater than 0") Integer id) {
        return forumService.deleteTopic(id)
                .then(Mono.just(new ApiResponse<>("Forum topic deleted successfully", null)))
                .onErrorResume(error -> Mono.just(new ApiResponse<>(error.getMessage(), null)));
    }

    // ========== POST ENDPOINTS ==========

    /**
     * Find forum posts by topic id with pagination
     */
    @GetMapping("/post")
    public Mono<ApiResponse<List<ForumPostDTO>>> getPostsByTopicId(
            @RequestParam @NotNull(message = "Topic ID is required") Integer topicId,
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "Page must be greater than or equal to 0") int page,
            @RequestParam(defaultValue = "20") @Min(value = 1, message = "Size must be greater than 0") int size) {
        return forumService.findPostsByTopicId(topicId, page, size)
                .collectList()
                .map(posts -> new ApiResponse<>("Posts retrieved successfully", posts))
                .onErrorResume(error -> Mono.just(new ApiResponse<>(error.getMessage(), null)));
    }

    /**
     * Create forum post
     */
    @PostMapping("/post")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ApiResponse<ForumPostDTO>> createPost(
            @Valid @RequestBody CreateForumPostRequest request) {
        return forumService.createPost(request)
                .map(post -> new ApiResponse<>("Forum post created successfully", post))
                .onErrorResume(error -> Mono.just(new ApiResponse<>(error.getMessage(), null)));
    }

    /**
     * Answer to another forum post
     */
    @PostMapping("/post/{postId}/answer")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ApiResponse<ForumPostDTO>> answerToPost(
            @PathVariable @Min(value = 1, message = "Post ID must be greater than 0") Integer postId,
            @Valid @RequestBody CreateForumPostRequest request) {
        return forumService.answerToPost(postId, request)
                .map(post -> new ApiResponse<>("Answer posted successfully", post))
                .onErrorResume(error -> Mono.just(new ApiResponse<>(error.getMessage(), null)));
    }

    /**
     * Ban a forum post
     */
    @PostMapping("/post/{id}/ban")
    public Mono<ApiResponse<Object>> banPost(
            @PathVariable @Min(value = 1, message = "Post ID must be greater than 0") Integer id) {
        return forumService.banPost(id)
                .then(Mono.just(new ApiResponse<>("Forum post banned successfully", null)))
                .onErrorResume(error -> Mono.just(new ApiResponse<>(error.getMessage(), null)));
    }

    /**
     * Unban a forum post
     */
    @PostMapping("/post/{id}/unban")
    public Mono<ApiResponse<Object>> unbanPost(
            @PathVariable @Min(value = 1, message = "Post ID must be greater than 0") Integer id) {
        return forumService.unbanPost(id)
                .then(Mono.just(new ApiResponse<>("Forum post unbanned successfully", null)))
                .onErrorResume(error -> Mono.just(new ApiResponse<>(error.getMessage(), null)));
    }

    /**
     * Delete a forum post
     */
    @DeleteMapping("/post/{id}")
    public Mono<ApiResponse<Object>> deletePost(
            @PathVariable @Min(value = 1, message = "Post ID must be greater than 0") Integer id) {
        return forumService.deletePost(id)
                .then(Mono.just(new ApiResponse<>("Forum post deleted successfully", null)))
                .onErrorResume(error -> Mono.just(new ApiResponse<>(error.getMessage(), null)));
    }
}

