package com.service.backend.forum.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import io.swagger.v3.oas.annotations.Parameter;
import com.service.backend.forum.dto.CreateForumCategoryRequest;
import com.service.backend.forum.dto.CreateForumPostRequest;
import com.service.backend.forum.dto.CreateForumTopicRequest;
import com.service.backend.forum.dto.CreateForumPostReactionRequest;
import com.service.backend.forum.dto.ForumCategoryDTO;
import com.service.backend.forum.dto.ForumPostDTO;
import com.service.backend.forum.dto.ForumPostReactionDTO;
import com.service.backend.forum.dto.ForumTopicDTO;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.forum.dto.UpdateForumCategoryRequest;
import com.service.backend.forum.dto.UpdateForumTopicRequest;
import com.service.backend.forum.service.ForumService;
import com.service.backend.shared.dto.ApiResponse;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import reactor.core.publisher.Flux;
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
    @GetMapping("/category")
    public Mono<ResponseEntity<ApiResponse<List<ForumCategoryDTO>>>> getAllCategoriesByOrganization(
            @Parameter(example = "1")
            @RequestParam @NotNull(message = "Organization ID is required") Integer organizationId) {
        return forumService.findAllCategoriesByOrganizationId(organizationId)
                .collectList()
                .map(categories -> ResponseEntity.ok(new ApiResponse<>("Categories retrieved successfully", categories)))
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiResponse<>(error.getMessage(), null))));
    }

    /**
     * Create forum category
     */
    @PostMapping("/category")
    public Mono<ResponseEntity<ApiResponse<ForumCategoryDTO>>> createCategory(
            @Valid @RequestBody CreateForumCategoryRequest request) {
        return forumService.createCategory(request)
                .map(category -> ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse<>("Forum category created successfully", category)))
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiResponse<>(error.getMessage(), null))));
    }

    /**
     * Update forum category
     */
    @PutMapping("/category/{id}")
    public Mono<ResponseEntity<ApiResponse<ForumCategoryDTO>>> updateCategory(
            @PathVariable @Min(value = 1, message = "Category ID must be greater than 0") Integer id,
            @Valid @RequestBody UpdateForumCategoryRequest request) {
        return forumService.updateCategory(id, request)
                .map(category -> ResponseEntity.ok(new ApiResponse<>("Forum category updated successfully", category)))
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiResponse<>(error.getMessage(), null))));
    }

    /**
     * Delete forum category
     */
    @DeleteMapping("/category/{id}")
    public Mono<ResponseEntity<ApiResponse<Object>>> deleteCategory(
            @PathVariable @Min(value = 1, message = "Category ID must be greater than 0") Integer id) {
        return forumService.deleteCategory(id)
                .then(Mono.just(ResponseEntity.ok(new ApiResponse<>("Forum category deleted successfully", null))))
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiResponse<>(error.getMessage(), null))));
    }

    // ========== TOPIC ENDPOINTS ==========

    /**
     * Find forum topic by title
     */
    @GetMapping("/topic/search")
    public Mono<ResponseEntity<ApiResponse<ForumTopicDTO>>> getTopicByTitle(
            @Parameter(example = "Hỏi đáp về đăng ký môn học")
            @RequestParam String title) {
        return forumService.findTopicByTitle(title)
                .map(topic -> ResponseEntity.ok(new ApiResponse<>("Topic found successfully", topic)))
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiResponse<>(error.getMessage(), null))));
    }

    /**
     * Find forum topics by category id with pagination
     */
    @GetMapping("/topic")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<ForumTopicDTO>>>> getTopicsByCategoryId(
            @Parameter(example = "2")
            @RequestParam Integer categoryId,
            @Parameter(example = "0")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(example = "10")
            @RequestParam(defaultValue = "10") int size) {
        return forumService.findTopicsByCategoryId(categoryId, page, size)
                .map(response -> ResponseEntity.ok(new ApiResponse<>("Topics retrieved successfully", response)))
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiResponse<>(error.getMessage(), null))));
    }

    /**
     * Create forum topic
     */
    @PostMapping("/topic")
    public Mono<ResponseEntity<ApiResponse<ForumTopicDTO>>> createTopic(
            @Valid @RequestBody CreateForumTopicRequest request) {
        return forumService.createTopic(request)
                .map(topic -> ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse<>("Forum topic created successfully", topic)))
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiResponse<>(error.getMessage(), null))));
    }

    /**
     * Update forum topic by id
     */
    @PutMapping("/topic/{id}")
    public Mono<ResponseEntity<ApiResponse<ForumTopicDTO>>> updateTopic(
            @PathVariable @Min(value = 1, message = "Topic ID must be greater than 0") Integer id,
            @Valid @RequestBody UpdateForumTopicRequest request) {
        return forumService.updateTopic(id, request)
                .map(topic -> ResponseEntity.ok(new ApiResponse<>("Forum topic updated successfully", topic)))
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiResponse<>(error.getMessage(), null))));
    }

    /**
     * Delete forum topic by id
     */
    @DeleteMapping("/topic/{id}")
    public Mono<ResponseEntity<ApiResponse<Object>>> deleteTopic(
            @PathVariable @Min(value = 1, message = "Topic ID must be greater than 0") Integer id) {
        return forumService.deleteTopic(id)
                .then(Mono.just(ResponseEntity.ok(new ApiResponse<>("Forum topic deleted successfully", null))))
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiResponse<>(error.getMessage(), null))));
    }

    // ========== POST ENDPOINTS ==========

    /**
     * Find forum posts by topic id with pagination
     */
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
                .map(response -> ResponseEntity.ok(new ApiResponse<>("Posts retrieved successfully", response)))
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiResponse<>(error.getMessage(), null))));
    }

    /**
     * Create forum post
     */
    @PostMapping("/post")
    public Mono<ResponseEntity<ApiResponse<ForumPostDTO>>> createPost(
            @Valid @RequestBody CreateForumPostRequest request) {
        return forumService.createPost(request)
                .map(post -> ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse<>("Forum post created successfully", post)))
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiResponse<>(error.getMessage(), null))));
    }

    /**
     * Answer to another forum post
     */
    @PostMapping("/post/{postId}/answer")
    public Mono<ResponseEntity<ApiResponse<ForumPostDTO>>> answerToPost(
            @PathVariable @Min(value = 1, message = "Post ID must be greater than 0") Integer postId,
            @Valid @RequestBody CreateForumPostRequest request) {
        return forumService.answerToPost(postId, request)
                .map(post -> ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse<>("Answer posted successfully", post)))
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiResponse<>(error.getMessage(), null))));
    }

    /**
     * Ban a forum post
     */
    @PostMapping("/post/{id}/ban")
    public Mono<ResponseEntity<ApiResponse<Object>>> banPost(
            @PathVariable @Min(value = 1, message = "Post ID must be greater than 0") Integer id) {
        return forumService.banPost(id)
                .then(Mono.just(ResponseEntity.ok(new ApiResponse<>("Forum post banned successfully", null))))
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiResponse<>(error.getMessage(), null))));
    }

    /**
     * Unban a forum post
     */
    @PostMapping("/post/{id}/unban")
    public Mono<ResponseEntity<ApiResponse<Object>>> unbanPost(
            @PathVariable @Min(value = 1, message = "Post ID must be greater than 0") Integer id) {
        return forumService.unbanPost(id)
                .then(Mono.just(ResponseEntity.ok(new ApiResponse<>("Forum post unbanned successfully", null))))
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiResponse<>(error.getMessage(), null))));
    }

    /**
     * Delete a forum post
     */
    @DeleteMapping("/post/{id}")
    public Mono<ResponseEntity<ApiResponse<Object>>> deletePost(
            @PathVariable @Min(value = 1, message = "Post ID must be greater than 0") Integer id) {
        return forumService.deletePost(id)
                .then(Mono.just(ResponseEntity.ok(new ApiResponse<>("Forum post deleted successfully", null))))
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiResponse<>(error.getMessage(), null))));
    }

    // ========== REACTION ENDPOINTS (LIKE/DISLIKE) ==========

    /**
     * Like or unlike a forum post
     */
    @PostMapping("/post/react")
    public Mono<ResponseEntity<ApiResponse<ForumPostReactionDTO>>> reactToPost(
            @Valid @RequestBody CreateForumPostReactionRequest request) {
        return forumService.reactToPost(request)
                .map(reaction -> ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse<>("Like added successfully", reaction)))
                .onErrorResume(error -> {
                    if ("REACTION_REMOVED".equals(error.getMessage())) {
                        return Mono.just(ResponseEntity.ok(new ApiResponse<>("Like removed successfully", null)));
                    }
                    return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiResponse<>(error.getMessage(), null)));
                });
    }

    /**
     * Get reaction counts for a post
     */
    @GetMapping("/post/{postId}/reactions/count")
    public Mono<ResponseEntity<ApiResponse<Map<String, Long>>>> getPostReactionCounts(
            @PathVariable @Min(value = 1, message = "Post ID must be greater than 0") Integer postId) {
        return forumService.getPostReactionCounts(postId)
                .map(counts -> ResponseEntity.ok(new ApiResponse<>("Reaction counts retrieved successfully", counts)))
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiResponse<>(error.getMessage(), null))));
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
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiResponse<>("No reaction found", null))));
    }

}

