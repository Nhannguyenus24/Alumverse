package com.service.backend.admin.controller;

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

import com.service.backend.organization.entity.Organization;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.admin.service.AdminOrganizationService;
import com.service.backend.shared.dto.ApiResponse;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/admin/organizations")
@Validated
public class AdminOrganizationController {
    
    private final AdminOrganizationService organizationService;
    
    public AdminOrganizationController(AdminOrganizationService organizationService) {
        this.organizationService = organizationService;
    }
    
    /**
     * Get all organizations with pagination
     */
    @GetMapping
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<Organization>>>> getAllOrganizations(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int size) {
        return organizationService.getAllOrganizations(page, size)
                .map(response -> ResponseEntity.ok(
                        new ApiResponse<>("Organizations fetched successfully", response)))
                .onErrorResume(error -> Mono.just(
                        ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body(new ApiResponse<>(error.getMessage(), null))));
    }
    
    /**
     * Get organization by ID
     */
    @GetMapping("/{organizationId}")
    public Mono<ResponseEntity<ApiResponse<Organization>>> getOrganizationById(
            @PathVariable Integer organizationId) {
        return organizationService.getOrganizationById(organizationId)
                .map(organization -> ResponseEntity.ok(
                        new ApiResponse<>("Organization fetched successfully", organization)))
                .switchIfEmpty(Mono.just(
                        ResponseEntity.status(HttpStatus.NOT_FOUND)
                                .body(new ApiResponse<>("Organization not found", null))))
                .onErrorResume(error -> Mono.just(
                        ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body(new ApiResponse<>(error.getMessage(), null))));
    }
    
    /**
     * Get organization by slug
     */
    @GetMapping("/slug/{slug}")
    public Mono<ResponseEntity<ApiResponse<Organization>>> getOrganizationBySlug(
            @PathVariable String slug) {
        return organizationService.getOrganizationBySlug(slug)
                .map(organization -> ResponseEntity.ok(
                        new ApiResponse<>("Organization fetched successfully", organization)))
                .switchIfEmpty(Mono.just(
                        ResponseEntity.status(HttpStatus.NOT_FOUND)
                                .body(new ApiResponse<>("Organization not found", null))))
                .onErrorResume(error -> Mono.just(
                        ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body(new ApiResponse<>(error.getMessage(), null))));
    }
    
    /**
     * Create new organization
     */
    @PostMapping
    public Mono<ResponseEntity<ApiResponse<Organization>>> createOrganization(
            @Valid @RequestBody Organization organization) {
        return organizationService.createOrganization(organization)
                .map(created -> ResponseEntity.status(HttpStatus.CREATED)
                        .body(new ApiResponse<>("Organization created successfully", created)))
                .onErrorResume(error -> Mono.just(
                        ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body(new ApiResponse<>(error.getMessage(), null))));
    }
    
    /**
     * Update organization
     */
    @PutMapping("/{organizationId}")
    public Mono<ResponseEntity<ApiResponse<Organization>>> updateOrganization(
            @PathVariable Integer organizationId,
            @Valid @RequestBody Organization organizationUpdate) {
        return organizationService.updateOrganization(organizationId, organizationUpdate)
                .map(updated -> ResponseEntity.ok(
                        new ApiResponse<>("Organization updated successfully", updated)))
                .switchIfEmpty(Mono.just(
                        ResponseEntity.status(HttpStatus.NOT_FOUND)
                                .body(new ApiResponse<>("Organization not found", null))))
                .onErrorResume(error -> Mono.just(
                        ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body(new ApiResponse<>(error.getMessage(), null))));
    }
    
    /**
     * Delete organization
     */
    @DeleteMapping("/{organizationId}")
    public Mono<ResponseEntity<ApiResponse<Boolean>>> deleteOrganization(
            @PathVariable Integer organizationId) {
        return organizationService.deleteOrganization(organizationId)
                .map(success -> {
                    if (success) {
                        return ResponseEntity.ok(
                                new ApiResponse<>("Organization deleted successfully", true));
                    } else {
                        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                .body(new ApiResponse<>("Organization not found", false));
                    }
                })
                .onErrorResume(error -> Mono.just(
                        ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body(new ApiResponse<>(error.getMessage(), false))));
    }
}
