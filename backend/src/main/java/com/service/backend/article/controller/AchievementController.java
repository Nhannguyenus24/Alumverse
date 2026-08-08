package com.service.backend.article.controller;

import com.service.backend.article.dto.CreateAchievementRequest;
import com.service.backend.article.dto.UpdateAchievementRequest;
import com.service.backend.article.dto.AchievementResponse;
import com.service.backend.shared.dto.FeaturedPaginatedResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.article.service.AchievementService;
import com.service.backend.shared.dto.ApiResponse;
import com.service.backend.shared.annotations.PublicEndpoint;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import com.service.backend.shared.enums.Status;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Articles > Achievements", description = "API endpoints for student and alumni achievements")
@RestController
@RequestMapping("/api/articles/achievements")
@RequiredArgsConstructor
@Validated
public class AchievementController {

    private final AchievementService achievementService;

    @PostMapping
    public Mono<ResponseEntity<ApiResponse<AchievementResponse>>> create(@Valid @RequestBody CreateAchievementRequest request) {
        return achievementService.create(request)
                .map(response -> ResponseEntity
                        .status(HttpStatus.CREATED)
                        .body(new ApiResponse<>("Achievement created successfully", response)));
    }

    @PutMapping("/{id}")
    public Mono<ResponseEntity<ApiResponse<AchievementResponse>>> update(
            @PathVariable @Min(1) Integer id,
            @Valid @RequestBody UpdateAchievementRequest request) {
        return achievementService.update(id, request)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Achievement updated successfully", response)));
    }

    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<ApiResponse<Void>>> delete(@PathVariable @Min(1) Integer id) {
        return achievementService.delete(id)
                .map(deleted -> ResponseEntity
                        .ok(new ApiResponse<>("Achievement deleted successfully", null)));
    }

    @PublicEndpoint
    @GetMapping("/{id}")
    public Mono<ResponseEntity<ApiResponse<AchievementResponse>>> getById(
            @PathVariable @Min(1) Integer id,
            @RequestParam(required = false) Integer organizationId) {
        return achievementService.getPublicById(id, organizationId)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Achievement retrieved successfully", response)));
    }

    @PublicEndpoint
    @GetMapping
    public Mono<ResponseEntity<ApiResponse<FeaturedPaginatedResponse<AchievementResponse>>>> getAll(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int limit,
            @RequestParam(required = false) Integer organizationId,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String topics,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @RequestParam(defaultValue = "updated") String sortBy,
            @RequestParam(defaultValue = "newest") String direction) {
        return achievementService.getPublicList(
                        page, limit, organizationId, q, topics, fromDate, toDate, sortBy, direction)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Achievements retrieved successfully", response)));
    }

    @PublicEndpoint
    @GetMapping("/member/{memberId}")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<AchievementResponse>>>> getByMemberId(
            @PathVariable @Min(1) Integer memberId,
            @RequestParam(required = false) Integer organizationId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return achievementService.getPublicByMemberId(memberId, organizationId, page, limit)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Achievements retrieved successfully", response)));
    }

    @GetMapping("/my")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<AchievementResponse>>>> getMyAchievements(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return achievementService.getMyAchievements(page, limit)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("My achievements retrieved successfully", response)));
    }

    @PublicEndpoint
    @GetMapping("/status/{status}")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<AchievementResponse>>>> getByStatus(
            @PathVariable @NotBlank String status,
            @RequestParam(required = false) Integer organizationId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        Status achievementStatus = Status.valueOf(status.toUpperCase());
        if (achievementStatus != Status.APPROVED) {
            return Mono.error(new com.service.backend.shared.exception.ApplicationException(
                    com.service.backend.shared.enums.ErrorCode.FORBIDDEN,
                    "Only approved achievements are publicly available"));
        }
        return achievementService.getByStatus(achievementStatus, organizationId, page, limit)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Achievements by status retrieved successfully", response)));
    }

    @PublicEndpoint
    @GetMapping("/search")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<AchievementResponse>>>> search(
            @RequestParam @NotBlank String keyword,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit,
            @RequestParam(required = false) Integer organizationId) {
        return achievementService.search(keyword, page, limit, organizationId)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Search results retrieved successfully", response)));
    }
}
