package com.service.backend.article.controller;

import com.service.backend.article.dto.CreateLearningResourceRequest;
import com.service.backend.article.dto.UpdateLearningResourceRequest;
import com.service.backend.article.dto.LearningResourceResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.article.service.LearningResourceService;
import com.service.backend.shared.dto.ApiResponse;
import com.service.backend.shared.annotations.PublicEndpoint;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Articles > Learning Resources", description = "API endpoints for learning materials and resources")
@RestController
@RequestMapping("/api/articles/learning-resources")
@RequiredArgsConstructor
@Validated
public class LearningResourceController {

    private final LearningResourceService learningResourceService;

    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    @PostMapping
    public Mono<ResponseEntity<ApiResponse<LearningResourceResponse>>> create(@Valid @RequestBody CreateLearningResourceRequest request) {
        return learningResourceService.create(request)
                .map(response -> ResponseEntity
                        .status(HttpStatus.CREATED)
                        .body(new ApiResponse<>("Learning resource created successfully", response)));
    }

    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    @PutMapping("/{id}")
    public Mono<ResponseEntity<ApiResponse<LearningResourceResponse>>> update(
            @PathVariable @Min(1) Integer id,
            @Valid @RequestBody UpdateLearningResourceRequest request) {
        return learningResourceService.update(id, request)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Learning resource updated successfully", response)));
    }

    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<ApiResponse<Void>>> delete(@PathVariable @Min(1) Integer id) {
        return learningResourceService.delete(id)
                .map(deleted -> ResponseEntity
                        .ok(new ApiResponse<>("Learning resource deleted successfully", null)));
    }

    @PublicEndpoint
    @GetMapping("/{id}")
    public Mono<ResponseEntity<ApiResponse<LearningResourceResponse>>> getById(@PathVariable @Min(1) Integer id) {
        return learningResourceService.getById(id)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Learning resource retrieved successfully", response)));
    }

    @PublicEndpoint
    @GetMapping
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<LearningResourceResponse>>>> getAll(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return learningResourceService.getAll(page, limit)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Learning resources retrieved successfully", response)));
    }

    @PublicEndpoint
    @GetMapping("/type/{type}")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<LearningResourceResponse>>>> getByType(
            @PathVariable @NotBlank String type,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return learningResourceService.getByType(type, page, limit)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Learning resources by type retrieved successfully", response)));
    }

    @PublicEndpoint
    @GetMapping("/search")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<LearningResourceResponse>>>> search(
            @RequestParam @NotBlank String keyword,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return learningResourceService.search(keyword, page, limit)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Search results retrieved successfully", response)));
    }
}
