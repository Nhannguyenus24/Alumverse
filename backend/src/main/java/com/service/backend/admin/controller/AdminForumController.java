package com.service.backend.admin.controller;

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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.service.backend.admin.service.AdminForumService;
import com.service.backend.forum.dto.ForumCategoryDTO;
import com.service.backend.forum.dto.ForumPostDTO;
import com.service.backend.forum.dto.ForumTopicDTO;
import com.service.backend.shared.dto.ApiResponse;
import com.service.backend.shared.dto.PaginatedResponse;

import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/admin/forum")
@Validated
@Tag(name = "Admin Forum Management", description = "Admin APIs for forum moderation and management")
public class AdminForumController {
    
    private final AdminForumService adminForumService;

    public AdminForumController(AdminForumService adminForumService) {
        this.adminForumService = adminForumService;
    }

    // ========== ADMIN POST MANAGEMENT ==========

    @GetMapping("/admin/posts/yesterday")
    public Mono<ResponseEntity<ApiResponse<List<ForumPostDTO>>>> adminGetNewForumPostsYesterday() {
        return adminForumService.getNewForumPostsYesterday()
                .collectList()
                .map(posts -> ResponseEntity.ok(new ApiResponse<>("Retrieved new forum posts created yesterday", posts)))
                .onErrorResume(this::handleError);
    }

    @GetMapping("/admin/posts/yesterday/paginated")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<ForumPostDTO>>>> adminGetNewForumPostsYesterdayPaginated(
            @Parameter(example = "0")
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "Page must be at least 0") int page,
            @Parameter(example = "10")
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "Size must be at least 1") int size) {
        return adminForumService.getNewForumPostsYesterdayWithPagination(page, size)
                .map(paginatedResponse -> ResponseEntity.ok(new ApiResponse<>("Retrieved paginated new forum posts created yesterday", paginatedResponse)))
                .onErrorResume(this::handleError);
    }

    @PostMapping("/admin/posts/{postId}/ban")
    public Mono<ResponseEntity<ApiResponse<ForumPostDTO>>> adminBanForumPost(
            @PathVariable @Min(value = 1, message = "Post ID must be greater than 0") Integer postId) {
        return adminForumService.banForumPost(postId)
                .map(post -> ResponseEntity.ok(new ApiResponse<>("Forum post banned successfully", post)))
                .onErrorResume(this::handleError);
    }

    @PostMapping("/admin/posts/{postId}/unban")
    public Mono<ResponseEntity<ApiResponse<ForumPostDTO>>> adminUnbanForumPost(
            @PathVariable @Min(value = 1, message = "Post ID must be greater than 0") Integer postId) {
        return adminForumService.unbanForumPost(postId)
                .map(post -> ResponseEntity.ok(new ApiResponse<>("Forum post unbanned successfully", post)))
                .onErrorResume(this::handleError);
    }

    @DeleteMapping("/admin/posts/{postId}")
    public Mono<ResponseEntity<ApiResponse<Void>>> adminDeleteForumPost(
            @PathVariable @Min(value = 1, message = "Post ID must be greater than 0") Integer postId) {
        return adminForumService.deleteForumPost(postId)
                .map(v -> ResponseEntity.ok(new ApiResponse<Void>("Forum post deleted successfully", null)))
                .onErrorResume(this::handleError);
    }

    @GetMapping("/admin/posts/banned/list")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<ForumPostDTO>>>> adminGetBannedPosts(
            @Parameter(example = "0")
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "Page must be at least 0") int page,
            @Parameter(example = "10")
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "Size must be at least 1") int size) {
        return adminForumService.getBannedPostsWithPagination(page, size)
                .map(paginatedResponse -> ResponseEntity.ok(new ApiResponse<>("Retrieved banned forum posts", paginatedResponse)))
                .onErrorResume(this::handleError);
    }

    // ========== ADMIN CATEGORY MANAGEMENT ==========

    @GetMapping("/admin/categories")
    public Mono<ResponseEntity<ApiResponse<List<ForumCategoryDTO>>>> adminGetAllCategories(
            @Parameter(example = "1")
            @RequestParam @Min(value = 1, message = "Organization ID must be greater than 0") Integer organizationId) {
        return adminForumService.getAllCategoriesByOrganization(organizationId)
                .collectList()
                .map(categories -> ResponseEntity.ok(new ApiResponse<>("Retrieved forum categories", categories)))
                .onErrorResume(this::handleError);
    }

    @GetMapping("/admin/categories/{categoryId}")
    public Mono<ResponseEntity<ApiResponse<ForumCategoryDTO>>> adminGetCategoryById(
            @PathVariable @Min(value = 1, message = "Category ID must be greater than 0") Integer categoryId) {
        return adminForumService.getCategoryById(categoryId)
                .map(category -> ResponseEntity.ok(new ApiResponse<>("Retrieved forum category", category)))
                .onErrorResume(this::handleError);
    }

    @PostMapping("/admin/categories")
    public Mono<ResponseEntity<ApiResponse<ForumCategoryDTO>>> adminCreateCategory(
            @Parameter(example = "1")
            @RequestParam @Min(value = 1, message = "Organization ID must be greater than 0") Integer organizationId,
            @Parameter(example = "General Discussion")
            @RequestParam @NotBlank(message = "Category name is required") String name,
            @Parameter(example = "General discussion topics")
            @RequestParam(required = false) String description) {
        return adminForumService.createCategory(organizationId, name, description)
                .map(category -> ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse<>("Forum category created successfully", category)))
                .onErrorResume(this::handleError);
    }

    @PutMapping("/admin/categories/{categoryId}")
    public Mono<ResponseEntity<ApiResponse<ForumCategoryDTO>>> adminUpdateCategory(
            @PathVariable @Min(value = 1, message = "Category ID must be greater than 0") Integer categoryId,
            @Parameter(example = "General Discussion")
            @RequestParam(required = false) String name,
            @Parameter(example = "General discussion topics")
            @RequestParam(required = false) String description) {
        return adminForumService.updateCategory(categoryId, name, description)
                .map(category -> ResponseEntity.ok(new ApiResponse<>("Forum category updated successfully", category)))
                .onErrorResume(this::handleError);
    }

    @DeleteMapping("/admin/categories/{categoryId}")
    public Mono<ResponseEntity<ApiResponse<Void>>> adminDeleteCategory(
            @PathVariable @Min(value = 1, message = "Category ID must be greater than 0") Integer categoryId) {
        return adminForumService.deleteCategory(categoryId)
                .map(v -> ResponseEntity.ok(new ApiResponse<Void>("Forum category deleted successfully", null)))
                .onErrorResume(this::handleError);
    }

    // ========== ADMIN TOPIC MANAGEMENT ==========

    @GetMapping("/admin/topics")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<ForumTopicDTO>>>> adminGetAllTopics(
            @Parameter(example = "1")
            @RequestParam @Min(value = 1, message = "Organization ID must be greater than 0") Integer organizationId,
            @Parameter(example = "0")
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "Page must be at least 0") int page,
            @Parameter(example = "10")
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "Size must be at least 1") int size) {
        return adminForumService.getAllTopicsByOrganization(organizationId, page, size)
                .map(paginatedResponse -> ResponseEntity.ok(new ApiResponse<>("Retrieved forum topics", paginatedResponse)))
                .onErrorResume(this::handleError);
    }

    @GetMapping("/admin/topics/{topicId}")
    public Mono<ResponseEntity<ApiResponse<ForumTopicDTO>>> adminGetTopicById(
            @PathVariable @Min(value = 1, message = "Topic ID must be greater than 0") Integer topicId) {
        return adminForumService.getTopicById(topicId)
                .map(topic -> ResponseEntity.ok(new ApiResponse<>("Retrieved forum topic", topic)))
                .onErrorResume(this::handleError);
    }

    @PostMapping("/admin/topics")
    public Mono<ResponseEntity<ApiResponse<ForumTopicDTO>>> adminCreateTopic(
            @Parameter(example = "1")
            @RequestParam @Min(value = 1, message = "Organization ID must be greater than 0") Integer organizationId,
            @Parameter(example = "1")
            @RequestParam @Min(value = 1, message = "Category ID must be greater than 0") Integer categoryId,
            @Parameter(example = "Welcome to our forum")
            @RequestParam @NotBlank(message = "Topic title is required") String title,
            @Parameter(example = "1")
            @RequestParam @Min(value = 1, message = "Member ID must be greater than 0") Integer createdByMemberId) {
        return adminForumService.createTopic(organizationId, categoryId, title, createdByMemberId)
                .map(topic -> ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse<>("Forum topic created successfully", topic)))
                .onErrorResume(this::handleError);
    }

    @PutMapping("/admin/topics/{topicId}")
    public Mono<ResponseEntity<ApiResponse<ForumTopicDTO>>> adminUpdateTopic(
            @PathVariable @Min(value = 1, message = "Topic ID must be greater than 0") Integer topicId,
            @Parameter(example = "Updated topic title")
            @RequestParam(required = false) String title,
            @Parameter(example = "1")
            @RequestParam(required = false) Integer categoryId) {
        return adminForumService.updateTopic(topicId, title, categoryId)
                .map(topic -> ResponseEntity.ok(new ApiResponse<>("Forum topic updated successfully", topic)))
                .onErrorResume(this::handleError);
    }

    @DeleteMapping("/admin/topics/{topicId}")
    public Mono<ResponseEntity<ApiResponse<Void>>> adminDeleteForumTopic(
            @PathVariable @Min(value = 1, message = "Topic ID must be greater than 0") Integer topicId) {
        return adminForumService.deleteForumTopic(topicId)
                .map(v -> ResponseEntity.ok(new ApiResponse<Void>("Forum topic and all posts deleted successfully", null)))
                .onErrorResume(this::handleError);
    }

    // ========== ADMIN STATISTICS ==========

    @GetMapping("/admin/statistics")
    public Mono<ResponseEntity<ApiResponse<Map<String, Long>>>> adminGetForumStatistics() {
        return adminForumService.getForumStatistics()
                .map(stats -> ResponseEntity.ok(new ApiResponse<>("Retrieved forum statistics", stats)))
                .onErrorResume(this::handleError);
    }

    // ========== ERROR HANDLER ==========

    private <T> Mono<ResponseEntity<ApiResponse<T>>> handleError(Throwable error) {
        return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>(error.getMessage(), null)));
    }
}
