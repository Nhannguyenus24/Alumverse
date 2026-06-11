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

import com.service.backend.admin.dto.ForumStatisticsDTO;
import com.service.backend.admin.dto.MonthlyActivityDTO;
import com.service.backend.admin.dto.OrganizationEngagementDTO;
import com.service.backend.admin.dto.ReviewForumReportRequest;
import com.service.backend.admin.dto.TopContributorDTO;
import com.service.backend.admin.dto.UpdatePostVisibilityRequest;
import com.service.backend.admin.dto.UpdateTopicLockRequest;
import com.service.backend.admin.service.AdminForumService;
import com.service.backend.forum.dto.ForumCategoryDTO;
import com.service.backend.forum.dto.ForumPostDTO;
import com.service.backend.forum.dto.ForumPostReportDTO;
import com.service.backend.forum.dto.ForumTopicDTO;
import com.service.backend.shared.dto.ApiResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.utils.SecurityUtils;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.Valid;
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
                .map(posts -> ResponseEntity.ok(new ApiResponse<>("Retrieved new forum posts created yesterday", posts)));
    }

    @GetMapping("/admin/posts/yesterday/paginated")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<ForumPostDTO>>>> adminGetNewForumPostsYesterdayPaginated(
            @RequestParam(required = false) Integer organizationId,
            @Parameter(example = "0")
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "Page must be at least 0") int page,
            @Parameter(example = "10")
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "Size must be at least 1") int size) {
        return adminForumService.getNewForumPostsYesterdayWithPagination(organizationId, page, size)
                .map(paginatedResponse -> ResponseEntity.ok(new ApiResponse<>("Retrieved paginated new forum posts created yesterday", paginatedResponse)));
    }

    @PostMapping("/admin/posts/{postId}/ban")
    public Mono<ResponseEntity<ApiResponse<ForumPostDTO>>> adminBanForumPost(
            @PathVariable @Min(value = 1, message = "Post ID must be greater than 0") Integer postId) {
        return adminForumService.banForumPost(postId)
                .map(post -> ResponseEntity.ok(new ApiResponse<>("Forum post banned successfully", post)));
    }

    @PostMapping("/admin/posts/{postId}/unban")
    public Mono<ResponseEntity<ApiResponse<ForumPostDTO>>> adminUnbanForumPost(
            @PathVariable @Min(value = 1, message = "Post ID must be greater than 0") Integer postId) {
        return adminForumService.unbanForumPost(postId)
                .map(post -> ResponseEntity.ok(new ApiResponse<>("Forum post unbanned successfully", post)));
    }

    @DeleteMapping("/admin/posts/{postId}")
    public Mono<ResponseEntity<ApiResponse<Void>>> adminDeleteForumPost(
            @PathVariable @Min(value = 1, message = "Post ID must be greater than 0") Integer postId) {
        return adminForumService.deleteForumPost(postId)
                .thenReturn(ResponseEntity.ok(new ApiResponse<Void>("Forum post deleted successfully", null)));
    }

    @GetMapping("/admin/posts/banned/list")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<ForumPostDTO>>>> adminGetBannedPosts(
            @RequestParam(required = false) Integer organizationId,
            @Parameter(example = "0")
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "Page must be at least 0") int page,
            @Parameter(example = "10")
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "Size must be at least 1") int size) {
        return adminForumService.getBannedPostsWithPagination(organizationId, page, size)
                .map(paginatedResponse -> ResponseEntity.ok(new ApiResponse<>("Retrieved banned forum posts", paginatedResponse)));
    }

    @GetMapping("/admin/posts")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<ForumPostDTO>>>> adminGetAllPosts(
            @RequestParam(required = false) Integer organizationId,
            @RequestParam(required = false) String keyword,
            @Parameter(example = "0")
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "Page must be at least 0") int page,
            @Parameter(example = "20")
            @RequestParam(defaultValue = "20") @Min(value = 1, message = "Size must be at least 1") int size) {
        return adminForumService.getAllPostsWithPagination(organizationId, keyword, page, size)
                .map(paginatedResponse -> ResponseEntity.ok(new ApiResponse<>("Retrieved forum posts", paginatedResponse)));
    }

    @GetMapping("/reports")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<ForumPostReportDTO>>>> getPendingReports(
            @RequestParam(required = false) Integer organizationId,
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "Page must be at least 0") int page,
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "Size must be at least 1") int size) {
        return adminForumService.getPendingReports(organizationId, page, size)
                .map(data -> ResponseEntity.ok(new ApiResponse<>("Retrieved pending reports", data)));
    }

    @PutMapping("/reports/{reportId}")
    public Mono<ResponseEntity<ApiResponse<ForumPostReportDTO>>> reviewReport(
            @PathVariable Long reportId,
            @Valid @RequestBody ReviewForumReportRequest request) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(adminId -> adminForumService.reviewReport(reportId, request, adminId.intValue()))
                .map(data -> ResponseEntity.ok(new ApiResponse<>("Reviewed report successfully", data)));
    }

    @PutMapping("/posts/{postId}/visibility")
    public Mono<ResponseEntity<ApiResponse<ForumPostDTO>>> updatePostVisibility(
            @PathVariable Integer postId,
            @Valid @RequestBody UpdatePostVisibilityRequest request) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(adminId -> adminForumService.updatePostVisibility(postId, request.getHidden(), adminId.intValue()))
                .map(data -> ResponseEntity.ok(new ApiResponse<>("Updated post visibility successfully", data)));
    }

    @PutMapping("/topics/{topicId}/lock")
    public Mono<ResponseEntity<ApiResponse<ForumTopicDTO>>> updateTopicLock(
            @PathVariable Integer topicId,
            @Valid @RequestBody UpdateTopicLockRequest request) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(adminId -> adminForumService.updateTopicLock(topicId, request.getLocked(), adminId.intValue()))
                .map(data -> ResponseEntity.ok(new ApiResponse<>("Updated topic lock status successfully", data)));
    }

    // ========== ADMIN CATEGORY MANAGEMENT ==========

    @GetMapping("/admin/categories")
    public Mono<ResponseEntity<ApiResponse<List<ForumCategoryDTO>>>> adminGetAllCategories(
            @Parameter(example = "1")
            @RequestParam @Min(value = 1, message = "Organization ID must be greater than 0") Integer organizationId) {
        return adminForumService.getAllCategoriesByOrganization(organizationId)
                .collectList()
                .map(categories -> ResponseEntity.ok(new ApiResponse<>("Retrieved forum categories", categories)));
    }

    @GetMapping("/admin/categories/{categoryId}")
    public Mono<ResponseEntity<ApiResponse<ForumCategoryDTO>>> adminGetCategoryById(
            @PathVariable @Min(value = 1, message = "Category ID must be greater than 0") Integer categoryId) {
        return adminForumService.getCategoryById(categoryId)
                .map(category -> ResponseEntity.ok(new ApiResponse<>("Retrieved forum category", category)));
    }

    @PostMapping("/admin/categories")
    public Mono<ResponseEntity<ApiResponse<ForumCategoryDTO>>> adminCreateCategory(
            @Parameter(example = "1")
            @RequestParam @Min(value = 1, message = "Organization ID must be greater than 0") Integer organizationId,
            @Parameter(example = "General Discussion")
            @RequestParam @NotBlank(message = "Category name is required") String name,
            @Parameter(example = "General discussion topics")
            @RequestParam(required = false) String description,
            @Parameter(example = "1")
            @RequestParam(required = false) Integer parentId) {
        return adminForumService.createCategory(organizationId, name, description, parentId)
                .map(category -> ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse<>("Forum category created successfully", category)));
    }

    @PutMapping("/admin/categories/{categoryId}")
    public Mono<ResponseEntity<ApiResponse<ForumCategoryDTO>>> adminUpdateCategory(
            @PathVariable @Min(value = 1, message = "Category ID must be greater than 0") Integer categoryId,
            @Parameter(example = "General Discussion")
            @RequestParam(required = false) String name,
            @Parameter(example = "General discussion topics")
            @RequestParam(required = false) String description,
            @Parameter(example = "1")
            @RequestParam(required = false) Integer parentId) {
        return adminForumService.updateCategory(categoryId, name, description, parentId)
                .map(category -> ResponseEntity.ok(new ApiResponse<>("Forum category updated successfully", category)));
    }

    @DeleteMapping("/admin/categories/{categoryId}")
    public Mono<ResponseEntity<ApiResponse<Void>>> adminDeleteCategory(
            @PathVariable @Min(value = 1, message = "Category ID must be greater than 0") Integer categoryId) {
        return adminForumService.deleteCategory(categoryId)
                .thenReturn(ResponseEntity.ok(new ApiResponse<Void>("Forum category deleted successfully", null)));
    }

    // ========== ADMIN TOPIC MANAGEMENT ==========

    @GetMapping("/admin/topics")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<ForumTopicDTO>>>> adminGetAllTopics(
            @Parameter(example = "1")
            @RequestParam(required = false) Integer organizationId,
            @RequestParam(required = false) String keyword,
            @Parameter(example = "0")
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "Page must be at least 0") int page,
            @Parameter(example = "10")
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "Size must be at least 1") int size) {
        return adminForumService.getAllTopicsByOrganization(organizationId, keyword, page, size)
                .map(paginatedResponse -> ResponseEntity.ok(new ApiResponse<>("Retrieved forum topics", paginatedResponse)));
    }

    @GetMapping("/admin/topics/{topicId}")
    public Mono<ResponseEntity<ApiResponse<ForumTopicDTO>>> adminGetTopicById(
            @PathVariable @Min(value = 1, message = "Topic ID must be greater than 0") Integer topicId) {
        return adminForumService.getTopicById(topicId)
                .map(topic -> ResponseEntity.ok(new ApiResponse<>("Retrieved forum topic", topic)));
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
                .map(topic -> ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse<>("Forum topic created successfully", topic)));
    }

    @PutMapping("/admin/topics/{topicId}")
    public Mono<ResponseEntity<ApiResponse<ForumTopicDTO>>> adminUpdateTopic(
            @PathVariable @Min(value = 1, message = "Topic ID must be greater than 0") Integer topicId,
            @Parameter(example = "Updated topic title")
            @RequestParam(required = false) String title,
            @Parameter(example = "1")
            @RequestParam(required = false) Integer categoryId) {
        return adminForumService.updateTopic(topicId, title, categoryId)
                .map(topic -> ResponseEntity.ok(new ApiResponse<>("Forum topic updated successfully", topic)));
    }

    @DeleteMapping("/admin/topics/{topicId}")
    public Mono<ResponseEntity<ApiResponse<Void>>> adminDeleteForumTopic(
            @PathVariable @Min(value = 1, message = "Topic ID must be greater than 0") Integer topicId) {
        return adminForumService.deleteForumTopic(topicId)
                .thenReturn(ResponseEntity.ok(new ApiResponse<Void>("Forum topic and all posts deleted successfully", null)));
    }

    // ========== ADMIN STATISTICS ==========

    @GetMapping("/admin/statistics")
    public Mono<ResponseEntity<ApiResponse<ForumStatisticsDTO>>> adminGetForumStatistics() {
        return adminForumService.getForumStatistics()
                .map(stats -> ResponseEntity.ok(new ApiResponse<>("Retrieved comprehensive forum statistics", stats)));
    }

    // ========== TOP CONTRIBUTORS ==========

    @Operation(summary = "Get top 10 contributors by month/year",
               description = "Returns the top 10 users who posted the most in the given month and year")
    @GetMapping("/admin/statistics/top-contributors")
    public Mono<ResponseEntity<ApiResponse<List<TopContributorDTO>>>> adminGetTopContributors(
            @Parameter(example = "4", description = "Month (1-12)")
            @RequestParam @Min(value = 1, message = "Month must be between 1 and 12")
                          @Max(value = 12, message = "Month must be between 1 and 12") int month,
            @Parameter(example = "2026", description = "Year")
            @RequestParam @Min(value = 2000, message = "Year must be at least 2000") int year) {
        return adminForumService.getTopContributors(month, year)
                .map(contributors -> ResponseEntity.ok(
                        new ApiResponse<>("Retrieved top 10 contributors for " + month + "/" + year, contributors)));
    }

    // ========== ORGANIZATION ENGAGEMENT RATE ==========

    @Operation(summary = "Get forum engagement rate per organization",
               description = "Returns the ratio of active forum users vs total members for each organization")
    @GetMapping("/admin/statistics/engagement")
    public Mono<ResponseEntity<ApiResponse<List<OrganizationEngagementDTO>>>> adminGetOrganizationEngagement() {
        return adminForumService.getOrganizationEngagement()
                .map(engagement -> ResponseEntity.ok(
                        new ApiResponse<>("Retrieved organization engagement rates", engagement)));
    }

    // ========== MONTHLY ACTIVITY TIMELINE ==========

    @Operation(summary = "Get monthly activity timeline",
               description = "Returns 12 months of activity data (active users, posts, topics) for the given year")
    @GetMapping("/admin/statistics/timeline")
    public Mono<ResponseEntity<ApiResponse<MonthlyActivityDTO>>> adminGetMonthlyTimeline(
            @Parameter(example = "2026", description = "Year")
            @RequestParam @Min(value = 2000, message = "Year must be at least 2000") int year) {
        return adminForumService.getMonthlyActivityTimeline(year)
                .map(timeline -> ResponseEntity.ok(
                        new ApiResponse<>("Retrieved monthly activity timeline for " + year, timeline)));
    }
}
