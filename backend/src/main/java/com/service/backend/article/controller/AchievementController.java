package com.service.backend.article.controller;

import com.service.backend.article.dto.CreateAchievementRequest;
import com.service.backend.article.dto.UpdateAchievementRequest;
import com.service.backend.article.dto.AchievementResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.article.usecase.AchievementService;
import com.service.backend.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;
import com.service.backend.shared.enums.Status;

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

    @GetMapping("/{id}")
    public Mono<ResponseEntity<ApiResponse<AchievementResponse>>> getById(@PathVariable @Min(1) Integer id) {
        return achievementService.getById(id)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Achievement retrieved successfully", response)));
    }

    @GetMapping
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<AchievementResponse>>>> getAll(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return achievementService.getAll(page, limit)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Achievements retrieved successfully", response)));
    }

    @GetMapping("/member/{memberId}")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<AchievementResponse>>>> getByMemberId(
            @PathVariable @Min(1) Integer memberId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return achievementService.getByMemberId(memberId, page, limit)
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

    @GetMapping("/status/{status}")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<AchievementResponse>>>> getByStatus(
            @PathVariable @NotBlank String status,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        Status achievementStatus = Status.valueOf(status.toUpperCase());
        return achievementService.getByStatus(achievementStatus, page, limit)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Achievements by status retrieved successfully", response)));
    }

    @GetMapping("/search")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<AchievementResponse>>>> search(
            @RequestParam @NotBlank String keyword,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return achievementService.search(keyword, page, limit)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Search results retrieved successfully", response)));
    }
}
