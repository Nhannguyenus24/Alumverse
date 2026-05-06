package com.service.backend.organization.controller;

import com.service.backend.organization.dto.CreateSchoolFeedbackRequest;
import com.service.backend.organization.entity.Organization;
import com.service.backend.organization.entity.SchoolFeedback;
import com.service.backend.organization.service.OrganizationService;
import com.service.backend.shared.dto.ApiResponse;
import com.service.backend.shared.exception.ApplicationException;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;
import java.util.List;

@RestController
@RequestMapping("/api/organizations")
@RequiredArgsConstructor
@Tag(name = "Organizations", description = "Public APIs for organization information")
public class OrganizationController {

    private static final Logger logger = LoggerFactory.getLogger(OrganizationController.class);
    private final OrganizationService organizationService;

    @GetMapping
    @Operation(
            summary = "Get all organizations",
            description = "Retrieve all organizations without authentication"
    )
    public Mono<ResponseEntity<ApiResponse<List<Organization>>>> getAllOrganizations() {
        logger.info("Fetching all organizations from controller");
        return organizationService.getAllOrganizations()
                .collectList()
                .map(organizations -> {
                    logger.info("Successfully retrieved {} organizations", organizations.size());
                    return ResponseEntity.ok(
                            new ApiResponse<>("Organizations retrieved successfully", organizations)
                    );
                })
                .onErrorResume(error -> {
                    logger.error("Error fetching all organizations", error);
                    if (error instanceof ApplicationException appException) {
                        return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body(new ApiResponse<>(appException.getMessage(), null)));
                    }
                    return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(new ApiResponse<>("Failed to retrieve organizations", null)));
                });
    }

    @GetMapping("/{slug}")
    @Operation(
            summary = "Get organization by slug",
            description = "Retrieve organization information by slug without authentication"
    )
    public Mono<ResponseEntity<ApiResponse<Organization>>> getOrganizationBySlug(
            @Parameter(description = "Organization slug", example = "hcmus")
            @PathVariable @NotBlank String slug) {
        logger.info("Fetching organization with slug: {}", slug);
        return organizationService.getOrganizationBySlug(slug)
                .map(organization -> {
                    logger.info("Successfully retrieved organization with slug: {}", slug);
                    return ResponseEntity.ok(
                            new ApiResponse<>("Organization retrieved successfully", organization)
                    );
                })
                .onErrorResume(error -> {
                    logger.error("Error fetching organization with slug: {}", slug, error);
                    if (error instanceof ApplicationException appException) {
                        return Mono.just(ResponseEntity.status(HttpStatus.NOT_FOUND)
                                .body(new ApiResponse<>(appException.getMessage(), null)));
                    }
                    return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(new ApiResponse<>("Failed to retrieve organization", null)));
                });
    }

    @PostMapping("/{organizationId}/feedbacks")
    @Operation(
            summary = "Create school feedback",
            description = "Submit feedback for an organization"
    )
    public Mono<ResponseEntity<ApiResponse<SchoolFeedback>>> createSchoolFeedback(
            @Parameter(description = "Organization ID", example = "1")
            @PathVariable Long organizationId,
            @Valid @RequestBody CreateSchoolFeedbackRequest request) {
        logger.info("Creating school feedback for organization id: {}", organizationId);
        return organizationService.createSchoolFeedback(organizationId, request)
                .map(feedback -> ResponseEntity.status(HttpStatus.CREATED)
                        .body(new ApiResponse<>("School feedback created successfully", feedback)))
                .onErrorResume(error -> {
                    logger.error("Error creating school feedback for organization id: {}", organizationId, error);
                    if (error instanceof ApplicationException appException) {
                        return Mono.just(ResponseEntity.status(HttpStatus.NOT_FOUND)
                                .body(new ApiResponse<>(appException.getMessage(), null)));
                    }
                    return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(new ApiResponse<>("Failed to create school feedback", null)));
                });
    }
}