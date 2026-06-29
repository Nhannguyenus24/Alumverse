package com.service.backend.article.controller;

import com.service.backend.article.dto.CreateJobRequest;
import com.service.backend.article.dto.UpdateJobRequest;
import com.service.backend.article.dto.JobResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.article.service.JobService;
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

@Tag(name = "Articles > Jobs", description = "API endpoints for job postings and recruitment")
@RestController
@RequestMapping("/api/articles/jobs")
@RequiredArgsConstructor
@Validated
public class JobController {

    private final JobService jobService;

    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    @PostMapping
    public Mono<ResponseEntity<ApiResponse<JobResponse>>> create(@Valid @RequestBody CreateJobRequest request) {
        return jobService.create(request)
                .map(response -> ResponseEntity
                        .status(HttpStatus.CREATED)
                        .body(new ApiResponse<>("Job created successfully", response)));
    }

    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    @PutMapping("/{id}")
    public Mono<ResponseEntity<ApiResponse<JobResponse>>> update(
            @PathVariable @Min(1) Integer id,
            @Valid @RequestBody UpdateJobRequest request) {
        return jobService.update(id, request)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Job updated successfully", response)));
    }

    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<ApiResponse<Void>>> delete(@PathVariable @Min(1) Integer id) {
        return jobService.delete(id)
                .map(deleted -> ResponseEntity
                        .ok(new ApiResponse<>("Job deleted successfully", null)));
    }

    @PublicEndpoint
    @GetMapping("/{id}")
    public Mono<ResponseEntity<ApiResponse<JobResponse>>> getById(@PathVariable @Min(1) Integer id) {
        return jobService.getById(id)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Job retrieved successfully", response)));
    }

    @PublicEndpoint
    @GetMapping
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<JobResponse>>>> getAll(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return jobService.getAll(page, limit)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Jobs retrieved successfully", response)));
    }

    @PublicEndpoint
    @GetMapping("/active")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<JobResponse>>>> getActive(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return jobService.getActive(page, limit)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Active jobs retrieved successfully", response)));
    }

    @PublicEndpoint
    @GetMapping("/open")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<JobResponse>>>> getOpenJobs(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return jobService.getOpenJobs(page, limit)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Open jobs retrieved successfully", response)));
    }

    @PublicEndpoint
    @GetMapping("/search")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<JobResponse>>>> search(
            @RequestParam @NotBlank String keyword,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return jobService.search(keyword, page, limit)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Search results retrieved successfully", response)));
    }

    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    @PostMapping("/{id}/activate")
    public Mono<ResponseEntity<ApiResponse<JobResponse>>> activate(@PathVariable @Min(1) Integer id) {
        return jobService.activate(id)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Job activated successfully", response)));
    }

    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    @PostMapping("/{id}/deactivate")
    public Mono<ResponseEntity<ApiResponse<JobResponse>>> deactivate(@PathVariable @Min(1) Integer id) {
        return jobService.deactivate(id)
                .map(response -> ResponseEntity
                        .ok(new ApiResponse<>("Job deactivated successfully", response)));
    }
}
