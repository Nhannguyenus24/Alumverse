package com.service.backend.forum.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import io.swagger.v3.oas.annotations.Parameter;
import com.service.backend.forum.dto.CreateForumCategoryRequest;
import com.service.backend.forum.dto.CreateForumPostRequest;
import com.service.backend.forum.dto.CreateForumTopicRequest;
import com.service.backend.forum.dto.CreateForumPostReactionRequest;
import com.service.backend.forum.dto.CreateForumPostReportRequest;
import com.service.backend.forum.dto.CreateForumTopicSubscriptionRequest;
import com.service.backend.forum.dto.ForumCategoryDTO;
import com.service.backend.forum.dto.ForumPostDTO;
import com.service.backend.forum.dto.ForumPostReactionDTO;
import com.service.backend.forum.dto.ForumPostReportDTO;
import com.service.backend.forum.dto.ForumTopicDTO;
import com.service.backend.forum.dto.ForumTopicSubscriptionDTO;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.forum.dto.UpdateForumCategoryRequest;
import com.service.backend.forum.dto.UpdateForumTopicRequest;
import com.service.backend.forum.dto.UpdateForumPostRequest;
import com.service.backend.forum.service.ForumService;
import com.service.backend.shared.dto.ApiResponse;
import com.service.backend.shared.annotations.PublicEndpoint;

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

    /**
     * Find all forum categories by organization id
     */
    @PublicEndpoint
    @GetMapping("/category")
    public Mono<ResponseEntity<ApiResponse<List<ForumCategoryDTO>>>> getAllCategoriesByOrganization(
            @Parameter(example = "1")
            @RequestParam @NotNull(message = "Organization ID is required") Integer organizationId) {
        return forumService.findAllCategoriesByOrganizationId(organizationId)
                .collectList()
                .map(categories -> ResponseEntity.ok(new ApiResponse<>("Categories retrieved successfully", categories)));
    }

    /**
     * Find forum category by id
     */
    @PublicEndpoint
    @GetMapping("/category/{id}")
    public Mono<ResponseEntity<ApiResponse<ForumCategoryDTO>>> getCategoryById(
            @PathVariable @Min(value = 1, message = "Category ID must be greater than 0") Integer id) {
        return forumService.findCategoryById(id)
                .map(category -> ResponseEntity.ok(new ApiResponse<>("Category retrieved successfully", category)));
    }

    /**
     * Create forum category
     */
    @PostMapping("/category")
    public Mono<ResponseEntity<ApiResponse<ForumCategoryDTO>>> createCategory(
            @Valid @RequestBody CreateForumCategoryRequest request) {
        return forumService.createCategory(request)
                .map(category -> ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse<>("Forum category created successfully", category)));
    }

    /**
     * Update forum category
     */
    @PutMapping("/category/{id}")
    public Mono<ResponseEntity<ApiResponse<ForumCategoryDTO>>> updateCategory(
            @PathVariable @Min(value = 1, message = "Category ID must be greater than 0") Integer id,
            @Valid @RequestBody UpdateForumCategoryRequest request) {
        return forumService.updateCategory(id, request)
                .map(category -> ResponseEntity.ok(new ApiResponse<>("Forum category updated successfully", category)));
    }


    // ========== TOPIC ENDPOINTS ==========

    /**
     * Find forum topic by title
     */
    @PublicEndpoint
    @GetMapping("/topic/search")
    public Mono<ResponseEntity<ApiResponse<ForumTopicDTO>>> getTopicByTitle(
            @Parameter(example = "Hỏi đáp về đăng ký môn học")
            @RequestParam String title) {
        return forumService.findTopicByTitle(title)
                .map(topic -> ResponseEntity.ok(new ApiResponse<>("Topic found successfully", topic)));
    }

    /**
     * Find forum topics by category id with pagination
     */
    @PublicEndpoint
    @GetMapping("/topic")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<ForumTopicDTO>>>> getTopicsByCategoryId(
            @Parameter(example = "2")
            @RequestParam Integer categoryId,
            @Parameter(example = "0")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(example = "10")
            @RequestParam(defaultValue = "10") int size) {
        return forumService.findTopicsByCategoryId(categoryId, page, size)
                .map(response -> ResponseEntity.ok(new ApiResponse<>("Topics retrieved successfully", response)));
    }

    /**
     * Create forum topic
     */
    @PostMapping("/topic")
    public Mono<ResponseEntity<ApiResponse<ForumTopicDTO>>> createTopic(
            @Valid @RequestBody CreateForumTopicRequest request) {
        return forumService.createTopic(request)
                .map(topic -> ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse<>("Forum topic created successfully", topic)));
    }

    /**
     * Update forum topic by id
     */
    @PutMapping("/topic/{id}")
    public Mono<ResponseEntity<ApiResponse<ForumTopicDTO>>> updateTopic(
            @PathVariable @Min(value = 1, message = "Topic ID must be greater than 0") Integer id,
            @Valid @RequestBody UpdateForumTopicRequest request) {
        return forumService.updateTopic(id, request)
                .map(topic -> ResponseEntity.ok(new ApiResponse<>("Forum topic updated successfully", topic)));
    }

    /**
     * Subscribe or unsubscribe to a forum topic
     */
    @PostMapping("/topic/subscribe")
    public Mono<ResponseEntity<ApiResponse<ForumTopicSubscriptionDTO>>> subscribeToTopic(
            @Valid @RequestBody CreateForumTopicSubscriptionRequest request) {
        return forumService.subscribeToTopic(request)
                .map(subscription -> ResponseEntity.status(HttpStatus.CREATED)
                        .body(new ApiResponse<>("Subscribed to topic successfully", subscription)))
                .switchIfEmpty(Mono.just(ResponseEntity.ok(new ApiResponse<>("Unsubscribed from topic successfully", null))));
    }

    /**
     * Check if a member is subscribed to a topic
     */
    @GetMapping("/topic/{topicId}/is-subscribed")
    public Mono<ResponseEntity<ApiResponse<Boolean>>> isSubscribed(
            @PathVariable @Min(value = 1, message = "Topic ID must be greater than 0") Integer topicId,
            @RequestParam @NotNull(message = "Member ID is required") Integer memberId) {
        return forumService.isSubscribed(topicId, memberId)
                .map(isSubscribed -> ResponseEntity.ok(new ApiResponse<>("Subscription status retrieved successfully", isSubscribed)));
    }

    // ========== POST ENDPOINTS ==========

    /**
     * Find forum posts by topic id with pagination
     */
    @PublicEndpoint
    @GetMapping("/post")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<ForumPostDTO>>>> getPostsByTopicId(
            @Parameter(example = "10")
            @RequestParam @NotNull(message = "Topic ID is required") Integer topicId,
            @Parameter(example = "0")
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "Page must be greater than or equal to 0") int page,
            @Parameter(example = "20")
            @RequestParam(defaultValue = "20") @Min(value = 1, message = "Size must be greater than 0") int size,
            @Parameter(example = "1")
            @RequestParam(required = false) Integer memberId) {
        return forumService.findPostsByTopicId(topicId, page, size, memberId)
                .map(response -> ResponseEntity.ok(new ApiResponse<>("Posts retrieved successfully", response)));
    }

    /**
     * Create forum post
     */
    @PostMapping("/post")
    public Mono<ResponseEntity<ApiResponse<ForumPostDTO>>> createPost(
            @Valid @RequestBody CreateForumPostRequest request) {
        return forumService.createPost(request)
                .map(post -> ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse<>("Forum post created successfully", post)));
    }

    /**
     * Answer to another forum post
     */
    @PostMapping("/post/{postId}/answer")
    public Mono<ResponseEntity<ApiResponse<ForumPostDTO>>> answerToPost(
            @PathVariable @Min(value = 1, message = "Post ID must be greater than 0") Integer postId,
            @Valid @RequestBody CreateForumPostRequest request) {
        return forumService.answerToPost(postId, request)
                .map(post -> ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse<>("Answer posted successfully", post)));
    }

    /**
     * Update forum post
     */
    @PutMapping("/post/{id}")
    public Mono<ResponseEntity<ApiResponse<ForumPostDTO>>> updatePost(
            @PathVariable @Min(value = 1, message = "Post ID must be greater than 0") Integer id,
            @Valid @RequestBody UpdateForumPostRequest request) {
        return forumService.updatePost(id, request)
                .map(post -> ResponseEntity.ok(new ApiResponse<>("Forum post updated successfully", post)));
    }

    /**
     * Delete forum post
     */
    @DeleteMapping("/post/{id}")
    public Mono<ResponseEntity<ApiResponse<Void>>> deletePost(
            @PathVariable @Min(value = 1, message = "Post ID must be greater than 0") Integer id) {
        return forumService.deletePost(id)
                .then(Mono.just(ResponseEntity.ok(new ApiResponse<Void>("Forum post deleted successfully", null))));
    }

    // ========== REACTION ENDPOINTS (LIKE/DISLIKE) ==========

    /**
     * Like or unlike a forum post
     */
    @PostMapping("/post/react")
    public Mono<ResponseEntity<ApiResponse<ForumPostReactionDTO>>> reactToPost(
            @Valid @RequestBody CreateForumPostReactionRequest request) {
        return forumService.reactToPost(request)
                .map(reaction -> ResponseEntity.status(HttpStatus.CREATED)
                        .body(new ApiResponse<>("Like added successfully", reaction)))
                .switchIfEmpty(Mono.just(ResponseEntity.ok(new ApiResponse<>("Like removed successfully", null))));
    }

    @PostMapping("/post/{id}/report")
    public Mono<ResponseEntity<ApiResponse<ForumPostReportDTO>>> reportPost(
            @PathVariable @Min(value = 1, message = "Post ID must be greater than 0") Integer id,
            @Valid @RequestBody CreateForumPostReportRequest request) {
        return forumService.reportPost(id, request)
                .map(report -> ResponseEntity.status(HttpStatus.CREATED)
                        .body(new ApiResponse<>("Post report submitted successfully", report)));
    }

    /**
     * Get reaction counts for a post
     */
    @PublicEndpoint
    @GetMapping("/post/{postId}/reactions/count")
    public Mono<ResponseEntity<ApiResponse<Map<String, Long>>>> getPostReactionCounts(
            @PathVariable @Min(value = 1, message = "Post ID must be greater than 0") Integer postId) {
        return forumService.getPostReactionCounts(postId)
                .map(counts -> ResponseEntity.ok(new ApiResponse<>("Reaction counts retrieved successfully", counts)));
    }

    /**
     * Get user's reaction for a specific post
     */
    @GetMapping("/post/{postId}/reactions/user")
    public Mono<ResponseEntity<ApiResponse<ForumPostReactionDTO>>> getUserReaction(
            @PathVariable @Min(value = 1, message = "Post ID must be greater than 0") Integer postId,
            @Parameter(example = "1")
            @RequestParam @NotNull(message = "Member ID is required") Integer memberId) {
        return forumService.getUserReaction(postId, memberId)
                .map(reaction -> ResponseEntity.ok(new ApiResponse<>("User reaction retrieved successfully", reaction)))
                .switchIfEmpty(Mono.just(ResponseEntity.ok(
                        new ApiResponse<>("No reaction found for this post", null))));
    }
}
