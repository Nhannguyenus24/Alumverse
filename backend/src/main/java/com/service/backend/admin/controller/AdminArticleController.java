package com.service.backend.admin.controller;

import com.service.backend.admin.service.AdminArticleService;
import com.service.backend.admin.service.AdminEventService;
import com.service.backend.article.dto.*;
import com.service.backend.event.entity.Event;
import com.service.backend.fundraising.dto.FundListItemResponse;
import com.service.backend.shared.dto.ApiResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Min;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/admin/articles")
@Validated
@Tag(name = "Admin Article Management", description = "Admin APIs for cross-organization article management")
public class AdminArticleController {

    private final AdminArticleService adminArticleService;
    private final AdminEventService adminEventService;

    public AdminArticleController(AdminArticleService adminArticleService, AdminEventService adminEventService) {
        this.adminArticleService = adminArticleService;
        this.adminEventService = adminEventService;
    }

    @Operation(summary = "Get all news across organizations")
    @GetMapping("/news")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<NewsResponse>>>> getAllNews(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return adminArticleService.getAllNews(page, limit)
                .map(response -> ResponseEntity.ok(new ApiResponse<>("News retrieved successfully", response)));
    }

    @Operation(summary = "Get all alumni posts across organizations")
    @GetMapping("/alumni-posts")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<AlumniPostResponse>>>> getAllAlumniPosts(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return adminArticleService.getAllAlumniPosts(page, limit)
                .map(response -> ResponseEntity.ok(new ApiResponse<>("Alumni posts retrieved successfully", response)));
    }

    @Operation(summary = "Get all achievements across organizations")
    @GetMapping("/achievements")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<AchievementResponse>>>> getAllAchievements(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return adminArticleService.getAllAchievements(page, limit)
                .map(response -> ResponseEntity.ok(new ApiResponse<>("Achievements retrieved successfully", response)));
    }

    @Operation(summary = "Get all jobs across organizations")
    @GetMapping("/jobs")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<JobResponse>>>> getAllJobs(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return adminArticleService.getAllJobs(page, limit)
                .map(response -> ResponseEntity.ok(new ApiResponse<>("Jobs retrieved successfully", response)));
    }

    @Operation(summary = "Get all learning resources across organizations")
    @GetMapping("/learning-resources")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<LearningResourceResponse>>>> getAllLearningResources(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return adminArticleService.getAllLearningResources(page, limit)
                .map(response -> ResponseEntity.ok(new ApiResponse<>("Learning resources retrieved successfully", response)));
    }

    @Operation(summary = "Get all events across organizations")
    @GetMapping("/events")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<Event>>>> getAllEvents(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return adminEventService.getAllEvents(page, limit)
                .map(response -> ResponseEntity.ok(new ApiResponse<>("Events retrieved successfully", response)));
    }

    @Operation(summary = "Get all funds across organizations")
    @GetMapping("/funds")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<FundListItemResponse>>>> getAllFunds(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return adminArticleService.getAllFunds(page, limit)
                .map(response -> ResponseEntity.ok(new ApiResponse<>("Funds retrieved successfully", response)));
    }
}
