package com.service.backend.admin.controller;

import java.util.List;

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

import com.service.backend.admin.service.AdminForumService;
import com.service.backend.forum.dto.CreateForumCategoryRequest;
import com.service.backend.forum.dto.CreateForumTopicRequest;
import com.service.backend.forum.dto.ForumCategoryDTO;
import com.service.backend.forum.dto.ForumPostDTO;
import com.service.backend.forum.dto.ForumPostPageResponse;
import com.service.backend.forum.dto.ForumTopicDTO;
import com.service.backend.forum.dto.ForumTopicPageResponse;
import com.service.backend.forum.dto.UpdateForumCategoryRequest;
import com.service.backend.forum.dto.UpdateForumTopicRequest;
import com.service.backend.shared.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/admin/forum")
@Validated
@Tag(name = "Admin Forum Management", description = "Admin endpoints for managing forum content and moderation")
public class AdminForumController {
    private final AdminForumService adminForumService;

    public AdminForumController(AdminForumService adminForumService) {
        this.adminForumService = adminForumService;
    }

    // ========== FORUM STATISTICS ==========

    /**
     * Get forum statistics by organization
     */
    @GetMapping("/statistics/organization/{organizationId}")
    public Mono<ResponseEntity<ApiResponse<Object>>> getForumStatisticsByOrganization(
            @PathVariable @Min(value = 1, message = "Organization ID must be greater than 0") Integer organizationId) {
        return adminForumService.getForumStatisticsByOrganization(organizationId)
                .map(stats -> ResponseEntity.ok(new ApiResponse<>("Forum statistics retrieved successfully", stats)))
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(new ApiResponse<>(error.getMessage(), null))));
    }

    /**
     * Get category statistics
     */
    @GetMapping("/statistics/category/{categoryId}")
    public Mono<ResponseEntity<ApiResponse<Object>>> getCategoryStatistics(
            @PathVariable @Min(value = 1, message = "Category ID must be greater than 0") Integer categoryId) {
        return adminForumService.getCategoryStatistics(categoryId)
                .map(stats -> ResponseEntity.ok(new ApiResponse<>("Category statistics retrieved successfully", stats)))
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(new ApiResponse<>(error.getMessage(), null))));
    }

    /**
     * Get topic statistics
     */
    @GetMapping("/statistics/topic/{topicId}")
    public Mono<ResponseEntity<ApiResponse<Object>>> getTopicStatistics(
            @PathVariable @Min(value = 1, message = "Topic ID must be greater than 0") Integer topicId) {
        return adminForumService.getTopicStatistics(topicId)
                .map(stats -> ResponseEntity.ok(new ApiResponse<>("Topic statistics retrieved successfully", stats)))
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(new ApiResponse<>(error.getMessage(), null))));
    }

    // ========== CATEGORY MANAGEMENT ==========

    /**
     * Get all categories with filtering
     */
    @GetMapping("/categories")
    public Mono<ResponseEntity<ApiResponse<List<ForumCategoryDTO>>>> getAllCategories(
            @Parameter(example = "1")
            @RequestParam(required = false) Integer organizationId,
            @Parameter(example = "0")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(example = "20")
            @RequestParam(defaultValue = "20") int size) {
        return adminForumService.getAllCategories(organizationId, page, size)
                .collectList()
                .map(categories -> ResponseEntity.ok(new ApiResponse<>("Categories retrieved successfully", categories)))
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(new ApiResponse<>(error.getMessage(), null))));
    }

    /**
     * Archive a forum category
     */
    @PostMapping("/category/{id}/archive")
    public Mono<ResponseEntity<ApiResponse<ForumCategoryDTO>>> archiveCategory(
            @PathVariable @Min(value = 1, message = "Category ID must be greater than 0") Integer id) {
        return adminForumService.archiveCategory(id)
                .map(category -> ResponseEntity.ok(new ApiResponse<>("Forum category archived successfully", category)))
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(new ApiResponse<>(error.getMessage(), null))));
    }

    /**
     * Restore an archived forum category
     */
    @PostMapping("/category/{id}/restore")
    public Mono<ResponseEntity<ApiResponse<ForumCategoryDTO>>> restoreCategory(
            @PathVariable @Min(value = 1, message = "Category ID must be greater than 0") Integer id) {
        return adminForumService.restoreCategory(id)
                .map(category -> ResponseEntity.ok(new ApiResponse<>("Forum category restored successfully", category)))
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(new ApiResponse<>(error.getMessage(), null))));
    }

    /**
     * Update category (admin version with additional fields)
     */
    @PutMapping("/category/{id}")
    public Mono<ResponseEntity<ApiResponse<ForumCategoryDTO>>> updateCategory(
            @PathVariable @Min(value = 1, message = "Category ID must be greater than 0") Integer id,
            @Valid @RequestBody UpdateForumCategoryRequest request) {
        return adminForumService.updateCategory(id, request)
                .map(category -> ResponseEntity.ok(new ApiResponse<>("Forum category updated successfully", category)))
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(new ApiResponse<>(error.getMessage(), null))));
    }

    // ========== TOPIC MANAGEMENT ==========

    /**
     * Get all topics with filtering and pagination
     */
    @GetMapping("/topics")
    public Mono<ResponseEntity<ApiResponse<ForumTopicPageResponse>>> getAllTopics(
            @Parameter(example = "1")
            @RequestParam(required = false) Integer organizationId,
            @Parameter(example = "2")
            @RequestParam(required = false) Integer categoryId,
            @Parameter(example = "0")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(example = "20")
            @RequestParam(defaultValue = "20") int size) {
        return adminForumService.getAllTopics(organizationId, categoryId, page, size)
                .map(response -> ResponseEntity.ok(new ApiResponse<>("Topics retrieved successfully", response)))
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(new ApiResponse<>(error.getMessage(), null))));
    }

    /**
     * Lock a forum topic (prevent new posts)
     */
    @PostMapping("/topic/{id}/lock")
    public Mono<ResponseEntity<ApiResponse<ForumTopicDTO>>> lockTopic(
            @PathVariable @Min(value = 1, message = "Topic ID must be greater than 0") Integer id) {
        return adminForumService.lockTopic(id)
                .map(topic -> ResponseEntity.ok(new ApiResponse<>("Forum topic locked successfully", topic)))
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(new ApiResponse<>(error.getMessage(), null))));
    }

    /**
     * Unlock a forum topic
     */
    @PostMapping("/topic/{id}/unlock")
    public Mono<ResponseEntity<ApiResponse<ForumTopicDTO>>> unlockTopic(
            @PathVariable @Min(value = 1, message = "Topic ID must be greater than 0") Integer id) {
        return adminForumService.unlockTopic(id)
                .map(topic -> ResponseEntity.ok(new ApiResponse<>("Forum topic unlocked successfully", topic)))
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(new ApiResponse<>(error.getMessage(), null))));
    }

    /**
     * Pin a topic to the top
     */
    @PostMapping("/topic/{id}/pin")
    public Mono<ResponseEntity<ApiResponse<ForumTopicDTO>>> pinTopic(
            @PathVariable @Min(value = 1, message = "Topic ID must be greater than 0") Integer id) {
        return adminForumService.pinTopic(id)
                .map(topic -> ResponseEntity.ok(new ApiResponse<>("Forum topic pinned successfully", topic)))
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(new ApiResponse<>(error.getMessage(), null))));
    }

    /**
     * Unpin a topic
     */
    @PostMapping("/topic/{id}/unpin")
    public Mono<ResponseEntity<ApiResponse<ForumTopicDTO>>> unpinTopic(
            @PathVariable @Min(value = 1, message = "Topic ID must be greater than 0") Integer id) {
        return adminForumService.unpinTopic(id)
                .map(topic -> ResponseEntity.ok(new ApiResponse<>("Forum topic unpinned successfully", topic)))
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(new ApiResponse<>(error.getMessage(), null))));
    }

    /**
     * Update topic (admin version)
     */
    @PutMapping("/topic/{id}")
    public Mono<ResponseEntity<ApiResponse<ForumTopicDTO>>> updateTopic(
            @PathVariable @Min(value = 1, message = "Topic ID must be greater than 0") Integer id,
            @Valid @RequestBody UpdateForumTopicRequest request) {
        return adminForumService.updateTopic(id, request)
                .map(topic -> ResponseEntity.ok(new ApiResponse<>("Forum topic updated successfully", topic)))
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(new ApiResponse<>(error.getMessage(), null))));
    }

    /**
     * Archive a topic
     */
    @PostMapping("/topic/{id}/archive")
    public Mono<ResponseEntity<ApiResponse<ForumTopicDTO>>> archiveTopic(
            @PathVariable @Min(value = 1, message = "Topic ID must be greater than 0") Integer id) {
        return adminForumService.archiveTopic(id)
                .map(topic -> ResponseEntity.ok(new ApiResponse<>("Forum topic archived successfully", topic)))
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(new ApiResponse<>(error.getMessage(), null))));
    }

    // ========== POST MODERATION ==========

    /**
     * Get all posts with filtering and pagination
     */
    @GetMapping("/posts")
    public Mono<ResponseEntity<ApiResponse<ForumPostPageResponse>>> getAllPosts(
            @Parameter(example = "1")
            @RequestParam(required = false) Integer organizationId,
            @Parameter(example = "2")
            @RequestParam(required = false) Integer categoryId,
            @Parameter(example = "10")
            @RequestParam(required = false) Integer topicId,
            @Parameter(example = "inactive")
            @RequestParam(required = false) String status,
            @Parameter(example = "0")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(example = "20")
            @RequestParam(defaultValue = "20") int size) {
        return adminForumService.getAllPosts(organizationId, categoryId, topicId, status, page, size)
                .map(response -> ResponseEntity.ok(new ApiResponse<>("Posts retrieved successfully", response)))
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(new ApiResponse<>(error.getMessage(), null))));
    }

    /**
     * Get flagged/reported posts
     */
    @GetMapping("/posts/flagged")
    public Mono<ResponseEntity<ApiResponse<ForumPostPageResponse>>> getFlaggedPosts(
            @Parameter(example = "1")
            @RequestParam(required = false) Integer organizationId,
            @Parameter(example = "0")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(example = "20")
            @RequestParam(defaultValue = "20") int size) {
        return adminForumService.getFlaggedPosts(organizationId, page, size)
                .map(response -> ResponseEntity.ok(new ApiResponse<>("Flagged posts retrieved successfully", response)))
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(new ApiResponse<>(error.getMessage(), null))));
    }

    /**
     * Mark a post as inappropriate/violating guidelines
     */
    @PostMapping("/post/{id}/flag")
    public Mono<ResponseEntity<ApiResponse<ForumPostDTO>>> flagPost(
            @PathVariable @Min(value = 1, message = "Post ID must be greater than 0") Integer id,
            @RequestParam(required = false) String reason) {
        return adminForumService.flagPost(id, reason)
                .map(post -> ResponseEntity.ok(new ApiResponse<>("Forum post flagged successfully", post)))
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(new ApiResponse<>(error.getMessage(), null))));
    }

    /**
     * Clear the flag on a post
     */
    @PostMapping("/post/{id}/unflag")
    public Mono<ResponseEntity<ApiResponse<ForumPostDTO>>> unflagPost(
            @PathVariable @Min(value = 1, message = "Post ID must be greater than 0") Integer id) {
        return adminForumService.unflagPost(id)
                .map(post -> ResponseEntity.ok(new ApiResponse<>("Forum post unflagged successfully", post)))
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(new ApiResponse<>(error.getMessage(), null))));
    }

    /**
     * Delete a post permanently (with cascade)
     */
    @DeleteMapping("/post/{id}")
    public Mono<ResponseEntity<ApiResponse<Object>>> deletePost(
            @PathVariable @Min(value = 1, message = "Post ID must be greater than 0") Integer id,
            @RequestParam(required = false) String reason) {
        return adminForumService.deletePost(id, reason)
                .then(Mono.just(ResponseEntity.ok(new ApiResponse<>("Forum post deleted successfully", null))))
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(new ApiResponse<>(error.getMessage(), null))));
    }

    /**
     * Get posts by specific user
     */
    @GetMapping("/posts/user/{userId}")
    public Mono<ResponseEntity<ApiResponse<ForumPostPageResponse>>> getPostsByUser(
            @PathVariable @Min(value = 1, message = "User ID must be greater than 0") Integer userId,
            @Parameter(example = "0")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(example = "20")
            @RequestParam(defaultValue = "20") int size) {
        return adminForumService.getPostsByUser(userId, page, size)
                .map(response -> ResponseEntity.ok(new ApiResponse<>("User posts retrieved successfully", response)))
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(new ApiResponse<>(error.getMessage(), null))));
    }

    // ========== CONTENT SEARCH & MONITORING ==========

    /**
     * Search forum content globally
     */
    @GetMapping("/search")
    public Mono<ResponseEntity<ApiResponse<Object>>> searchForum(
            @Parameter(example = "java")
            @RequestParam @NotNull(message = "Search query is required") String query,
            @Parameter(example = "1")
            @RequestParam(required = false) Integer organizationId,
            @Parameter(example = "0")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(example = "20")
            @RequestParam(defaultValue = "20") int size) {
        return adminForumService.searchForum(query, organizationId, page, size)
                .map(results -> ResponseEntity.ok(new ApiResponse<>("Search results retrieved successfully", results)))
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(new ApiResponse<>(error.getMessage(), null))));
    }

    /**
     * Get recent activity in forum
     */
    @GetMapping("/activity/recent")
    public Mono<ResponseEntity<ApiResponse<Object>>> getRecentActivity(
            @Parameter(example = "1")
            @RequestParam(required = false) Integer organizationId,
            @Parameter(example = "20")
            @RequestParam(defaultValue = "20") int limit) {
        return adminForumService.getRecentActivity(organizationId, limit)
                .collectList()
                .map(activities -> ResponseEntity.ok(new ApiResponse<>("Recent activity retrieved successfully", activities)))
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(new ApiResponse<>(error.getMessage(), null))));
    }

    /**
     * Get users with high moderation flags
     */
    @GetMapping("/monitor/problematic-users")
    public Mono<ResponseEntity<ApiResponse<Object>>> getProblematicUsers(
            @Parameter(example = "1")
            @RequestParam(required = false) Integer organizationId,
            @Parameter(example = "5")
            @RequestParam(defaultValue = "5") int minFlags) {
        return adminForumService.getProblematicUsers(organizationId, minFlags)
                .collectList()
                .map(users -> ResponseEntity.ok(new ApiResponse<>("Problematic users retrieved successfully", users)))
                .onErrorResume(error -> Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(new ApiResponse<>(error.getMessage(), null))));
    }
}
