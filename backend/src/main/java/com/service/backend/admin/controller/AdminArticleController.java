package com.service.backend.admin.controller;

import com.service.backend.admin.dto.ContentStatisticsDTO;
import com.service.backend.admin.service.AdminArticleService;
import com.service.backend.admin.service.AdminContentService;
import com.service.backend.admin.service.AdminEventService;
import com.service.backend.article.dto.*;
import com.service.backend.shared.entity.Event;
import com.service.backend.fundraising.dto.FundListItemResponse;
import com.service.backend.shared.dto.ApiResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.enums.Status;
import com.service.backend.shared.utils.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Min;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;
import org.springframework.security.access.prepost.PreAuthorize;

@Tag(name = "Admin > Articles", description = "API endpoints for managing articles by administrators")
@RestController
@RequestMapping("/api/admin/articles")
@Validated
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
public class AdminArticleController {

    private final AdminArticleService adminArticleService;
    private final AdminEventService adminEventService;
    private final AdminContentService adminContentService;

    public AdminArticleController(AdminArticleService adminArticleService,
                                   AdminEventService adminEventService,
                                   AdminContentService adminContentService) {
        this.adminArticleService = adminArticleService;
        this.adminEventService = adminEventService;
        this.adminContentService = adminContentService;
    }

    @Operation(summary = "Get all news across organizations")
    @GetMapping("/news")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<NewsResponse>>>> getAllNews(
            @RequestParam(required = false) Integer organizationId,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return SecurityUtils.resolveOrganizationId(organizationId)
                .flatMap(resolvedOrgId -> adminArticleService.getAllNews(resolvedOrgId, keyword, page, limit))
                .switchIfEmpty(adminArticleService.getAllNews(null, keyword, page, limit))
                .map(response -> ResponseEntity.ok(new ApiResponse<>("News retrieved successfully", response)));
    }

    @Operation(summary = "Get all alumni posts across organizations")
    @GetMapping("/alumni-posts")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<AlumniPostResponse>>>> getAllAlumniPosts(
            @RequestParam(required = false) Integer organizationId,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return SecurityUtils.resolveOrganizationId(organizationId)
                .flatMap(resolvedOrgId -> adminArticleService.getAllAlumniPosts(resolvedOrgId, keyword, page, limit))
                .switchIfEmpty(adminArticleService.getAllAlumniPosts(null, keyword, page, limit))
                .map(response -> ResponseEntity.ok(new ApiResponse<>("Alumni posts retrieved successfully", response)));
    }

    @Operation(summary = "Get all achievements across organizations")
    @GetMapping("/achievements")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<AchievementResponse>>>> getAllAchievements(
            @RequestParam(required = false) Integer organizationId,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return SecurityUtils.resolveOrganizationId(organizationId)
                .flatMap(resolvedOrgId -> adminArticleService.getAllAchievements(resolvedOrgId, keyword, page, limit))
                .switchIfEmpty(adminArticleService.getAllAchievements(null, keyword, page, limit))
                .map(response -> ResponseEntity.ok(new ApiResponse<>("Achievements retrieved successfully", response)));
    }

    @Operation(summary = "Get all jobs across organizations")
    @GetMapping("/jobs")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<JobResponse>>>> getAllJobs(
            @RequestParam(required = false) Integer organizationId,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return SecurityUtils.resolveOrganizationId(organizationId)
                .flatMap(resolvedOrgId -> adminArticleService.getAllJobs(resolvedOrgId, keyword, page, limit))
                .switchIfEmpty(adminArticleService.getAllJobs(null, keyword, page, limit))
                .map(response -> ResponseEntity.ok(new ApiResponse<>("Jobs retrieved successfully", response)));
    }

    @Operation(summary = "Get all learning resources across organizations")
    @GetMapping("/learning-resources")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<LearningResourceResponse>>>> getAllLearningResources(
            @RequestParam(required = false) Integer organizationId,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return SecurityUtils.resolveOrganizationId(organizationId)
                .flatMap(resolvedOrgId -> adminArticleService.getAllLearningResources(resolvedOrgId, keyword, page, limit))
                .switchIfEmpty(adminArticleService.getAllLearningResources(null, keyword, page, limit))
                .map(response -> ResponseEntity.ok(new ApiResponse<>("Learning resources retrieved successfully", response)));
    }

    @Operation(summary = "Approve an achievement article request")
    @PostMapping("/achievements/{id}/approve")
    public Mono<ResponseEntity<ApiResponse<AchievementResponse>>> approveAchievement(@PathVariable @Min(1) Integer id) {
        return adminArticleService.updateAchievementStatus(id, Status.APPROVED)
                .map(response -> ResponseEntity.ok(new ApiResponse<>("Achievement approved successfully", response)));
    }

    @Operation(summary = "Reject an achievement article request")
    @PostMapping("/achievements/{id}/reject")
    public Mono<ResponseEntity<ApiResponse<AchievementResponse>>> rejectAchievement(@PathVariable @Min(1) Integer id) {
        return adminArticleService.updateAchievementStatus(id, Status.PENDING)
                .map(response -> ResponseEntity.ok(new ApiResponse<>("Achievement rejected successfully", response)));
    }

    @Operation(summary = "Approve a learning resource article request")
    @PostMapping("/learning-resources/{id}/approve")
    public Mono<ResponseEntity<ApiResponse<LearningResourceResponse>>> approveLearningResource(@PathVariable @Min(1) Integer id) {
        return adminArticleService.updateLearningResourceStatus(id, Status.APPROVED)
                .map(response -> ResponseEntity.ok(new ApiResponse<>("Learning resource approved successfully", response)));
    }

    @Operation(summary = "Reject a learning resource article request")
    @PostMapping("/learning-resources/{id}/reject")
    public Mono<ResponseEntity<ApiResponse<LearningResourceResponse>>> rejectLearningResource(@PathVariable @Min(1) Integer id) {
        return adminArticleService.updateLearningResourceStatus(id, Status.PENDING)
                .map(response -> ResponseEntity.ok(new ApiResponse<>("Learning resource rejected successfully", response)));
    }

    @Operation(summary = "Get all events across organizations")
    @GetMapping("/events")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<Event>>>> getAllEvents(
            @RequestParam(required = false) Long organizationId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        Integer orgIdInt = organizationId != null ? organizationId.intValue() : null;
        return SecurityUtils.resolveOrganizationId(orgIdInt)
                .flatMap(resolvedOrgId -> adminEventService.getAllEvents(resolvedOrgId.longValue(), page, limit))
                .switchIfEmpty(adminEventService.getAllEvents(null, page, limit))
                .map(response -> ResponseEntity.ok(new ApiResponse<>("Events retrieved successfully", response)));
    }

    @Operation(summary = "Get all funds across organizations")
    @GetMapping("/funds")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<FundListItemResponse>>>> getAllFunds(
            @RequestParam(required = false) Integer organizationId,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return SecurityUtils.resolveOrganizationId(organizationId)
                .flatMap(resolvedOrgId -> adminArticleService.getAllFunds(resolvedOrgId, keyword, page, limit))
                .switchIfEmpty(adminArticleService.getAllFunds(null, keyword, page, limit))
                .map(response -> ResponseEntity.ok(new ApiResponse<>("Funds retrieved successfully", response)));
    }

    @Operation(summary = "Get content statistics across all types")
    @GetMapping("/statistics")
    public Mono<ResponseEntity<ApiResponse<ContentStatisticsDTO>>> getContentStatistics() {
        return adminContentService.getStatistics()
                .map(stats -> ResponseEntity.ok(new ApiResponse<>("Content statistics fetched successfully", stats)));
    }
}
