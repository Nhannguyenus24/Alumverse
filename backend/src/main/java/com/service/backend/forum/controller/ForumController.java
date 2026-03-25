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
import com.service.backend.shared.constants.ErrorCode;
import com.service.backend.shared.dto.ApiResponse;
import com.service.backend.shared.exception.ApplicationException;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import reactor.core.publisher.Mono;
import org.springframework.web.server.ResponseStatusException;

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
                .onErrorResume(this::handleError);
    }

    /**
     * Create forum category
     */
    @PostMapping("/category")
    public Mono<ResponseEntity<ApiResponse<ForumCategoryDTO>>> createCategory(
            @Valid @RequestBody CreateForumCategoryRequest request) {
        return forumService.createCategory(request)
                .map(category -> ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse<>("Forum category created successfully", category)))
                .onErrorResume(this::handleError);
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
                .onErrorResume(this::handleError);
    }

    /**
     * Delete forum category
     */
    @DeleteMapping("/category/{id}")
    public Mono<ResponseEntity<ApiResponse<Object>>> deleteCategory(
            @PathVariable @Min(value = 1, message = "Category ID must be greater than 0") Integer id) {
        return forumService.deleteCategory(id)
                .then(Mono.just(ResponseEntity.ok(new ApiResponse<>("Forum category deleted successfully", null))))
                .onErrorResume(this::handleError);
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
                .onErrorResume(this::handleError);
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
                .onErrorResume(this::handleError);
    }

    /**
     * Create forum topic
     */
    @PostMapping("/topic")
    public Mono<ResponseEntity<ApiResponse<ForumTopicDTO>>> createTopic(
            @Valid @RequestBody CreateForumTopicRequest request) {
        return forumService.createTopic(request)
                .map(topic -> ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse<>("Forum topic created successfully", topic)))
                .onErrorResume(this::handleError);
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
                .onErrorResume(this::handleError);
    }

    /**
     * Delete forum topic by id
     */
    @DeleteMapping("/topic/{id}")
    public Mono<ResponseEntity<ApiResponse<Object>>> deleteTopic(
            @PathVariable @Min(value = 1, message = "Topic ID must be greater than 0") Integer id) {
        return forumService.deleteTopic(id)
                .then(Mono.just(ResponseEntity.ok(new ApiResponse<>("Forum topic deleted successfully", null))))
                .onErrorResume(this::handleError);
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
                .onErrorResume(this::handleError);
    }

    /**
     * Create forum post
     */
    @PostMapping("/post")
    public Mono<ResponseEntity<ApiResponse<ForumPostDTO>>> createPost(
            @Valid @RequestBody CreateForumPostRequest request) {
        return forumService.createPost(request)
                .map(post -> ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse<>("Forum post created successfully", post)))
                .onErrorResume(this::handleError);
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
                .onErrorResume(this::handleError);
    }

    /**
     * Ban a forum post
     */
    @PostMapping("/post/{id}/ban")
    public Mono<ResponseEntity<ApiResponse<Object>>> banPost(
            @PathVariable @Min(value = 1, message = "Post ID must be greater than 0") Integer id) {
        return forumService.banPost(id)
                .then(Mono.just(ResponseEntity.ok(new ApiResponse<>("Forum post banned successfully", null))))
                .onErrorResume(this::handleError);
    }

    /**
     * Unban a forum post
     */
    @PostMapping("/post/{id}/unban")
    public Mono<ResponseEntity<ApiResponse<Object>>> unbanPost(
            @PathVariable @Min(value = 1, message = "Post ID must be greater than 0") Integer id) {
        return forumService.unbanPost(id)
                .then(Mono.just(ResponseEntity.ok(new ApiResponse<>("Forum post unbanned successfully", null))))
                .onErrorResume(this::handleError);
    }

    /**
     * Delete a forum post
     */
    @DeleteMapping("/post/{id}")
    public Mono<ResponseEntity<ApiResponse<Object>>> deletePost(
            @PathVariable @Min(value = 1, message = "Post ID must be greater than 0") Integer id) {
        return forumService.deletePost(id)
                .then(Mono.just(ResponseEntity.ok(new ApiResponse<>("Forum post deleted successfully", null))))
                .onErrorResume(this::handleError);
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
                    return handleError(error);
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
                .onErrorResume(this::handleError);
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
                .switchIfEmpty(Mono.just(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ApiResponse<>("No reaction found", null))))
                .onErrorResume(this::handleError);
    }

    private <T> Mono<ResponseEntity<ApiResponse<T>>> handleError(Throwable error) {
        HttpStatus status = resolveHttpStatus(error);
        return Mono.just(ResponseEntity.status(status)
                .body(new ApiResponse<>(error.getMessage(), null)));
    }

    private HttpStatus resolveHttpStatus(Throwable error) {
        if (error instanceof ResponseStatusException responseStatusException) {
            return HttpStatus.valueOf(responseStatusException.getStatusCode().value());
        }

        if (error instanceof ApplicationException applicationException) {
            return mapErrorCodeToHttpStatus(applicationException.getErrorCode());
        }

        String message = error.getMessage();
        if (message == null) {
            return HttpStatus.INTERNAL_SERVER_ERROR;
        }

        if (ErrorCode.FORUM_CATEGORY_NOT_FOUND.getMessage().equals(message)
                || ErrorCode.FORUM_TOPIC_NOT_FOUND.getMessage().equals(message)
                || ErrorCode.FORUM_POST_NOT_FOUND.getMessage().equals(message)
                || ErrorCode.RESOURCES_NOT_FOUND.getMessage().equals(message)
                || ErrorCode.USER_NOT_FOUND.getMessage().equals(message)) {
            return HttpStatus.NOT_FOUND;
        }

        if (ErrorCode.INVALID_TOPIC_ID.getMessage().equals(message)) {
            return HttpStatus.BAD_REQUEST;
        }

        return HttpStatus.INTERNAL_SERVER_ERROR;
    }

    private HttpStatus mapErrorCodeToHttpStatus(ErrorCode errorCode) {
        return switch (errorCode) {
            case FORUM_CATEGORY_NOT_FOUND,
                 FORUM_TOPIC_NOT_FOUND,
                 FORUM_POST_NOT_FOUND,
                 RESOURCES_NOT_FOUND,
                 USER_NOT_FOUND -> HttpStatus.NOT_FOUND;
            case INVALID_TOPIC_ID -> HttpStatus.BAD_REQUEST;
            case RESOURCES_DUPLICATE -> HttpStatus.CONFLICT;
            case FORBIDDEN -> HttpStatus.FORBIDDEN;
            default -> HttpStatus.INTERNAL_SERVER_ERROR;
        };
    }

}

