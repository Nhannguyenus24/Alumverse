package com.service.backend.organization.controller;

import com.service.backend.organization.dto.CreateSchoolFeedbackRequest;
import com.service.backend.organization.dto.OrganizationIntroductionResponse;
import com.service.backend.organization.dto.TrustedVerifierResponse;
import com.service.backend.shared.entity.Organization;
import com.service.backend.shared.entity.SchoolFeedback;
import com.service.backend.organization.service.OrganizationService;
import com.service.backend.shared.dto.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;
import java.util.List;
import com.service.backend.shared.annotations.PublicEndpoint;

@Tag(name = "Organizations", description = "API endpoints for public organization directory")
@RestController
@RequestMapping("/api/organizations")
@RequiredArgsConstructor
public class OrganizationController {
    private final OrganizationService organizationService;

    @PublicEndpoint
    @GetMapping
    @Operation(
            summary = "Get all organizations",
            description = "Retrieve all organizations without authentication"
    )
    public Mono<ResponseEntity<ApiResponse<List<Organization>>>> getAllOrganizations() {
        return organizationService.getAllOrganizations()
                .collectList()
                .map(organizations -> ResponseEntity.ok(
                        new ApiResponse<>("Organizations retrieved successfully", organizations)
                ));
    }

    @PublicEndpoint
    @GetMapping("/{slug}")
    @Operation(
            summary = "Get organization by slug",
            description = "Retrieve organization information by slug without authentication"
    )
    public Mono<ResponseEntity<ApiResponse<Organization>>> getOrganizationBySlug(
            @Parameter(description = "Organization slug", example = "hcmus")
            @PathVariable @NotBlank String slug) {
        return organizationService.getOrganizationBySlug(slug)
                .map(organization -> ResponseEntity.ok(
                        new ApiResponse<>("Organization retrieved successfully", organization)
                ));
    }

    @PublicEndpoint
    @GetMapping("/{organizationId}/introduction")
    @Operation(
            summary = "Get organization introduction",
            description = "Retrieve introduction content and images for an organization"
    )
    public Mono<ResponseEntity<ApiResponse<OrganizationIntroductionResponse>>> getIntroduction(
            @Parameter(description = "Organization ID", example = "1")
            @PathVariable Integer organizationId) {
        return organizationService.getIntroduction(organizationId)
                .map(intro -> ResponseEntity.ok(
                        new ApiResponse<>("Introduction retrieved successfully", intro)));
    }

    @PostMapping("/{organizationId}/feedbacks")
    @Operation(
            summary = "Create school feedback",
            description = "Submit feedback for an organization"
    )
    public Mono<ResponseEntity<ApiResponse<SchoolFeedback>>> createSchoolFeedback(
            @Parameter(description = "Organization ID", example = "1")
            @PathVariable Integer organizationId,
            @Valid @RequestBody CreateSchoolFeedbackRequest request) {
        return organizationService.createSchoolFeedback(organizationId, request)
                .map(feedback -> ResponseEntity.status(HttpStatus.CREATED)
                        .body(new ApiResponse<>("School feedback created successfully", feedback)));
    }

    @PublicEndpoint
    @GetMapping("/{organizationId}/trusted-verifiers")
    @Operation(
            summary = "Get trusted verifiers",
            description = "Retrieve a list of trusted verifiers for an organization"
    )
    public Mono<ResponseEntity<ApiResponse<List<TrustedVerifierResponse>>>> getTrustedVerifiers(
            @Parameter(description = "Organization ID", example = "1")
            @PathVariable Integer organizationId) {
        return organizationService.getTrustedVerifiers(organizationId)
                .collectList()
                .map(verifiers -> ResponseEntity.ok(
                        new ApiResponse<>("Trusted verifiers retrieved successfully", verifiers)));
    }
}