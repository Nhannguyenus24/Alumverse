package com.service.backend.article.controller;

import com.service.backend.article.dto.CreateAlumniPostRequest;
import com.service.backend.article.dto.UpdateAlumniPostRequest;
import com.service.backend.article.dto.AlumniPostResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.article.service.AlumniPostService;
import com.service.backend.shared.dto.ApiResponse;
import com.service.backend.shared.annotations.PublicEndpoint;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Articles > Alumni Posts", description = "API endpoints for posts created by alumni")
@RestController
@RequestMapping("/api/articles/alumni-posts")
@RequiredArgsConstructor
@Validated
public class AlumniPostController {

    private final AlumniPostService alumniPostService;

    @PostMapping
    public Mono<ResponseEntity<ApiResponse<AlumniPostResponse>>> create(@Valid @RequestBody CreateAlumniPostRequest request) {
        return alumniPostService.create(request)
                .map(response -> ResponseEntity
                        .status(HttpStatus.CREATED)
                        .body(new ApiResponse<>("Alumni post created successfully", response)));
    }

    @PutMapping("/{id}")
    public Mono<ResponseEntity<ApiResponse<AlumniPostResponse>>> update(
            @PathVariable @Min(1) Integer id,
            @Valid @RequestBody UpdateAlumniPostRequest request) {
        return alumniPostService.update(id, request)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Alumni post updated successfully", response)));
    }

    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<ApiResponse<Void>>> delete(@PathVariable @Min(1) Integer id) {
        return alumniPostService.delete(id)
                .map(deleted -> ResponseEntity
                        .ok(new ApiResponse<>("Alumni post deleted successfully", null)));
    }

    @PublicEndpoint
    @GetMapping("/{id}")
    public Mono<ResponseEntity<ApiResponse<AlumniPostResponse>>> getById(
            @PathVariable @Min(1) Integer id,
            @RequestParam(required = false) Integer organizationId) {
        return alumniPostService.getPublicById(id, organizationId)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Alumni post retrieved successfully", response)));
    }

    @PublicEndpoint
    @GetMapping("/slug/{slug}")
    public Mono<ResponseEntity<ApiResponse<AlumniPostResponse>>> getBySlug(
            @PathVariable @NotBlank String slug,
            @RequestParam(required = false) Integer organizationId) {
        return alumniPostService.getPublicBySlug(slug, organizationId)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Alumni post retrieved successfully", response)));
    }

    @PublicEndpoint
    @GetMapping
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<AlumniPostResponse>>>> getAll(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit,
            @RequestParam(required = false) Integer organizationId) {
        return alumniPostService.getPublished(page, limit, organizationId)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Alumni posts retrieved successfully", response)));
    }

    @PublicEndpoint
    @GetMapping("/published")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<AlumniPostResponse>>>> getPublished(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit,
            @RequestParam(required = false) Integer organizationId) {
        return alumniPostService.getPublished(page, limit, organizationId)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Published alumni posts retrieved successfully", response)));
    }

    @PublicEndpoint
    @GetMapping("/user/{userId}")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<AlumniPostResponse>>>> getByUserId(
            @PathVariable @Min(1) Integer userId,
            @RequestParam(required = false) Integer organizationId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return alumniPostService.getByAuthorMemberId(userId, organizationId, page, limit)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Alumni posts by user retrieved successfully", response)));
    }

    @PublicEndpoint
    @GetMapping("/search")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<AlumniPostResponse>>>> search(
            @RequestParam @NotBlank String keyword,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit,
            @RequestParam(required = false) Integer organizationId) {
        return alumniPostService.search(keyword, page, limit, organizationId)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Search results retrieved successfully", response)));
    }

    @PostMapping("/{id}/publish")
    public Mono<ResponseEntity<ApiResponse<AlumniPostResponse>>> publish(@PathVariable @Min(1) Integer id) {
        return alumniPostService.publish(id)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Alumni post published successfully", response)));
    }

    @PostMapping("/{id}/hide")
    public Mono<ResponseEntity<ApiResponse<AlumniPostResponse>>> hide(@PathVariable @Min(1) Integer id) {
        return alumniPostService.hide(id)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Alumni post hidden successfully", response)));
    }
}
