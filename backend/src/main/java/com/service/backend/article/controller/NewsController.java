package com.service.backend.article.controller;

import com.service.backend.article.dto.CreateNewsRequest;
import com.service.backend.article.dto.UpdateNewsRequest;
import com.service.backend.article.dto.NewsResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.article.service.NewsService;
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

@Tag(name = "Articles > News", description = "API endpoints for campus and alumni news")
@RestController
@RequestMapping("/api/articles/news")
@RequiredArgsConstructor
@Validated
public class NewsController {

    private final NewsService newsService;

    @PostMapping
    public Mono<ResponseEntity<ApiResponse<NewsResponse>>> create(@Valid @RequestBody CreateNewsRequest request) {
        return newsService.create(request)
                .map(response -> ResponseEntity
                        .status(HttpStatus.CREATED)
                        .body(new ApiResponse<>("News created successfully", response)));
    }

    @PutMapping("/{id}")
    public Mono<ResponseEntity<ApiResponse<NewsResponse>>> update(
            @PathVariable @Min(1) Integer id,
            @Valid @RequestBody UpdateNewsRequest request) {
        return newsService.update(id, request)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("News updated successfully", response)));
    }

    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<ApiResponse<Void>>> delete(@PathVariable @Min(1) Integer id) {
        return newsService.delete(id)
                .map(deleted -> ResponseEntity
                        .ok(new ApiResponse<>("News deleted successfully", null)));
    }

    @PublicEndpoint
    @GetMapping("/{id}")
    public Mono<ResponseEntity<ApiResponse<NewsResponse>>> getById(
            @PathVariable @Min(1) Integer id,
            @RequestParam(required = false) Integer organizationId) {
        return newsService.getPublicById(id, organizationId)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("News retrieved successfully", response)));
    }

    @PublicEndpoint
    @GetMapping("/slug/{slug}")
    public Mono<ResponseEntity<ApiResponse<NewsResponse>>> getBySlug(
            @PathVariable @NotBlank String slug,
            @RequestParam(required = false) Integer organizationId) {
        return newsService.getPublicBySlug(slug, organizationId)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("News retrieved successfully", response)));
    }

    @PublicEndpoint
    @GetMapping
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<NewsResponse>>>> getAll(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit,
            @RequestParam(required = false) Integer organizationId) {
        return newsService.getPublished(page, limit, organizationId)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("News retrieved successfully", response)));
    }

    @PublicEndpoint
    @GetMapping("/published")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<NewsResponse>>>> getPublished(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit,
            @RequestParam(required = false) Integer organizationId) {
        return newsService.getPublished(page, limit, organizationId)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Published news retrieved successfully", response)));
    }

    @PublicEndpoint
    @GetMapping("/search")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<NewsResponse>>>> search(
            @RequestParam @NotBlank String keyword,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit,
            @RequestParam(required = false) Integer organizationId) {
        return newsService.search(keyword, page, limit, organizationId)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Search results retrieved successfully", response)));
    }

    @PostMapping("/{id}/publish")
    public Mono<ResponseEntity<ApiResponse<NewsResponse>>> publish(@PathVariable @Min(1) Integer id) {
        return newsService.publish(id)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("News published successfully", response)));
    }

    @PostMapping("/{id}/hide")
    public Mono<ResponseEntity<ApiResponse<NewsResponse>>> hide(@PathVariable @Min(1) Integer id) {
        return newsService.hide(id)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("News hidden successfully", response)));
    }
}
