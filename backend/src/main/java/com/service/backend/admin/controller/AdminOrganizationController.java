package com.service.backend.admin.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.service.backend.admin.dto.FeedbackStatisticsDTO;
import com.service.backend.admin.dto.OrganizationOptionRequest;
import com.service.backend.admin.dto.UpdateOrganizationOptionRequest;
import com.service.backend.admin.dto.UpdateOrganizationRequest;
import com.service.backend.admin.dto.UpsertOrganizationIntroductionRequest;
import com.service.backend.admin.dto.config.FeatureConfig;
import com.service.backend.organization.dto.OrganizationIntroductionResponse;

import java.util.Map;
import com.service.backend.shared.entity.Organization;
import com.service.backend.shared.entity.SchoolFeedback;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.admin.service.AdminOrganizationService;
import com.service.backend.shared.dto.ApiResponse;
import com.service.backend.shared.exception.ApplicationException;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import reactor.core.publisher.Mono;

import java.util.List;

@RestController
@RequestMapping("/api/admin/organizations")
@Validated
public class AdminOrganizationController {
    
    private final AdminOrganizationService organizationService;
    
    public AdminOrganizationController(AdminOrganizationService organizationService) {
        this.organizationService = organizationService;
    }
    
    /**
     * Get all organizations with pagination and search
     */
    @GetMapping
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<Organization>>>> getAllOrganizations(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int size,
            @RequestParam(required = false) String search) {
        return organizationService.getAllOrganizations(page, size, search)
                .map(response -> ResponseEntity.ok(
                        new ApiResponse<>("Organizations fetched successfully", response)));
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
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.ORGANIZATION_NOT_FOUND, "Organization not found")));
    }

    @GetMapping("/feedbacks")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<SchoolFeedback>>>> getSchoolFeedbacks(
            @RequestParam(required = false) Integer organizationId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int size) {
        return organizationService.getSchoolFeedbacks(organizationId, page, size)
                .map(response -> ResponseEntity.ok(
                        new ApiResponse<>("School feedbacks fetched successfully", response)));
    }

    @PatchMapping("/feedbacks/{feedbackId}/read")
    public Mono<ResponseEntity<ApiResponse<Boolean>>> markSchoolFeedbackAsRead(
            @PathVariable Integer feedbackId) {
        return organizationService.markSchoolFeedbackAsRead(feedbackId)
                .thenReturn(ResponseEntity.ok(
                        new ApiResponse<>("School feedback marked as read", true)));
    }

    @GetMapping("/feedback-statistics")
    public Mono<ResponseEntity<ApiResponse<FeedbackStatisticsDTO>>> getFeedbackStatistics() {
        return organizationService.getFeedbackStatistics()
                .map(stats -> ResponseEntity.ok(
                        new ApiResponse<>("Feedback statistics fetched successfully", stats)));
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
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.ORGANIZATION_NOT_FOUND, "Organization not found")));
    }
    
    /**
     * Create new organization
     */
    @PostMapping
    public Mono<ResponseEntity<ApiResponse<Organization>>> createOrganization(
            @Valid @RequestBody UpdateOrganizationRequest organization) {
        return organizationService.createOrganization(organization)
                .map(created -> ResponseEntity.status(HttpStatus.CREATED)
                        .body(new ApiResponse<>("Organization created successfully", created)));
    }
    
    /**
     * Update organization
     */
    @PutMapping("/{organizationId}")
    public Mono<ResponseEntity<ApiResponse<Organization>>> updateOrganization(
            @PathVariable Integer organizationId,
            @Valid @RequestBody UpdateOrganizationRequest organizationUpdate) {
        return organizationService.updateOrganization(organizationId, organizationUpdate)
                .map(updated -> ResponseEntity.ok(
                        new ApiResponse<>("Organization updated successfully", updated)))
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.ORGANIZATION_NOT_FOUND, "Organization not found")));
    }
    
    /**
     * Delete organization
     */
    @DeleteMapping("/{organizationId}")
    public Mono<ResponseEntity<ApiResponse<Boolean>>> deleteOrganization(
            @PathVariable Integer organizationId) {
        return organizationService.deleteOrganization(organizationId)
                .flatMap(success -> {
                    if (success) {
                        return Mono.just(ResponseEntity.ok(
                                new ApiResponse<>("Organization deleted successfully", true)));
                    } else {
                        return Mono.error(new ApplicationException(ErrorCode.ORGANIZATION_NOT_FOUND, "Organization not found"));
                    }
                });
    }

    @PutMapping("/{organizationId}/introduction")
    public Mono<ResponseEntity<ApiResponse<OrganizationIntroductionResponse>>> upsertIntroduction(
            @PathVariable Integer organizationId,
            @Valid @RequestBody UpsertOrganizationIntroductionRequest request) {
        return organizationService.upsertIntroduction(organizationId, request)
                .map(intro -> ResponseEntity.ok(
                        new ApiResponse<>("Introduction saved successfully", intro)));
    }

    @GetMapping("/{organizationId}/programs")
    public Mono<ResponseEntity<ApiResponse<List<String>>>> getPrograms(
            @PathVariable Integer organizationId) {
        return organizationService.getPrograms(organizationId)
                .map(programs -> ResponseEntity.ok(
                        new ApiResponse<>("Programs fetched successfully", programs)));
    }

    @PostMapping("/{organizationId}/programs")
    public Mono<ResponseEntity<ApiResponse<List<String>>>> addProgram(
            @PathVariable Integer organizationId,
            @Valid @RequestBody OrganizationOptionRequest request) {
        return organizationService.addProgram(organizationId, request.getValue())
                .map(programs -> ResponseEntity.ok(
                        new ApiResponse<>("Program added successfully", programs)));
    }

    @PutMapping("/{organizationId}/programs")
    public Mono<ResponseEntity<ApiResponse<List<String>>>> updateProgram(
            @PathVariable Integer organizationId,
            @Valid @RequestBody UpdateOrganizationOptionRequest request) {
        return organizationService.updateProgram(organizationId, request.getOldValue(), request.getNewValue())
                .map(programs -> ResponseEntity.ok(
                        new ApiResponse<>("Program updated successfully", programs)));
    }

    @DeleteMapping("/{organizationId}/programs")
    public Mono<ResponseEntity<ApiResponse<List<String>>>> removeProgram(
            @PathVariable Integer organizationId,
            @RequestParam @NotBlank String value) {
        return organizationService.removeProgram(organizationId, value)
                .map(programs -> ResponseEntity.ok(
                        new ApiResponse<>("Program removed successfully", programs)));
    }

    @GetMapping("/{organizationId}/majors")
    public Mono<ResponseEntity<ApiResponse<List<String>>>> getMajors(
            @PathVariable Integer organizationId) {
        return organizationService.getMajors(organizationId)
                .map(majors -> ResponseEntity.ok(
                        new ApiResponse<>("Majors fetched successfully", majors)));
    }

    @PostMapping("/{organizationId}/majors")
    public Mono<ResponseEntity<ApiResponse<List<String>>>> addMajor(
            @PathVariable Integer organizationId,
            @Valid @RequestBody OrganizationOptionRequest request) {
        return organizationService.addMajor(organizationId, request.getValue())
                .map(majors -> ResponseEntity.ok(
                        new ApiResponse<>("Major added successfully", majors)));
    }

    @PutMapping("/{organizationId}/majors")
    public Mono<ResponseEntity<ApiResponse<List<String>>>> updateMajor(
            @PathVariable Integer organizationId,
            @Valid @RequestBody UpdateOrganizationOptionRequest request) {
        return organizationService.updateMajor(organizationId, request.getOldValue(), request.getNewValue())
                .map(majors -> ResponseEntity.ok(
                        new ApiResponse<>("Major updated successfully", majors)));
    }

    @DeleteMapping("/{organizationId}/majors")
    public Mono<ResponseEntity<ApiResponse<List<String>>>> removeMajor(
            @PathVariable Integer organizationId,
            @RequestParam @NotBlank String value) {
        return organizationService.removeMajor(organizationId, value)
                .map(majors -> ResponseEntity.ok(
                        new ApiResponse<>("Major removed successfully", majors)));
    }

    @GetMapping("/{organizationId}/features-config")
    public Mono<ResponseEntity<ApiResponse<FeatureConfig>>> getConfig(
            @PathVariable Integer organizationId) {
        return organizationService.getConfig(organizationId)
                .map(config -> ResponseEntity.ok(
                        new ApiResponse<>("Config fetched successfully", config)));
    }

    @PutMapping("/{organizationId}/features-config")
    public Mono<ResponseEntity<ApiResponse<FeatureConfig>>> updateConfig(
            @PathVariable Integer organizationId,
            @RequestBody FeatureConfig config) {
        return organizationService.updateConfig(organizationId, config)
                .map(updated -> ResponseEntity.ok(
                        new ApiResponse<>("Config updated successfully", updated)));
    }

    @GetMapping("/{organizationId}/features-config/site-identity")
    public Mono<ResponseEntity<ApiResponse<FeatureConfig.SiteIdentity>>> getSiteIdentity(
            @PathVariable Integer organizationId) {
        return organizationService.getSiteIdentity(organizationId)
                .map(v -> ResponseEntity.ok(new ApiResponse<>("Fetched successfully", v)));
    }

    @PutMapping("/{organizationId}/features-config/site-identity")
    public Mono<ResponseEntity<ApiResponse<FeatureConfig>>> updateSiteIdentity(
            @PathVariable Integer organizationId,
            @RequestBody FeatureConfig.SiteIdentity siteIdentity) {
        return organizationService.updateSiteIdentity(organizationId, siteIdentity)
                .map(updated -> ResponseEntity.ok(new ApiResponse<>("Updated successfully", updated)));
    }

    @GetMapping("/{organizationId}/features-config/brand")
    public Mono<ResponseEntity<ApiResponse<FeatureConfig.BrandConfig>>> getBrandConfig(
            @PathVariable Integer organizationId) {
        return organizationService.getBrandConfig(organizationId)
                .map(v -> ResponseEntity.ok(new ApiResponse<>("Fetched successfully", v)));
    }

    @PutMapping("/{organizationId}/features-config/brand")
    public Mono<ResponseEntity<ApiResponse<FeatureConfig>>> updateBrandConfig(
            @PathVariable Integer organizationId,
            @RequestBody FeatureConfig.BrandConfig brandConfig) {
        return organizationService.updateBrandConfig(organizationId, brandConfig)
                .map(updated -> ResponseEntity.ok(new ApiResponse<>("Updated successfully", updated)));
    }

    @GetMapping("/{organizationId}/features-config/features")
    public Mono<ResponseEntity<ApiResponse<Map<String, FeatureConfig.Feature>>>> getFeatures(
            @PathVariable Integer organizationId) {
        return organizationService.getFeatures(organizationId)
                .map(v -> ResponseEntity.ok(new ApiResponse<>("Fetched successfully", v)));
    }

    @PutMapping("/{organizationId}/features-config/features")
    public Mono<ResponseEntity<ApiResponse<FeatureConfig>>> updateFeatures(
            @PathVariable Integer organizationId,
            @RequestBody Map<String, FeatureConfig.Feature> featuresConfig) {
        return organizationService.updateFeatures(organizationId, featuresConfig)
                .map(updated -> ResponseEntity.ok(new ApiResponse<>("Updated successfully", updated)));
    }

    @GetMapping("/{organizationId}/features-config/features/{featureName}")
    public Mono<ResponseEntity<ApiResponse<FeatureConfig.Feature>>> getFeature(
            @PathVariable Integer organizationId,
            @PathVariable String featureName) {
        return organizationService.getFeature(organizationId, featureName)
                .map(v -> ResponseEntity.ok(new ApiResponse<>("Fetched successfully", v)));
    }

    @PutMapping("/{organizationId}/features-config/features/{featureName}")
    public Mono<ResponseEntity<ApiResponse<FeatureConfig>>> updateFeature(
            @PathVariable Integer organizationId,
            @PathVariable String featureName,
            @RequestBody FeatureConfig.Feature patch) {
        return organizationService.updateFeature(organizationId, featureName, patch)
                .map(updated -> ResponseEntity.ok(new ApiResponse<>("Updated successfully", updated)));
    }

    @PatchMapping("/{organizationId}/features-config/features/{featureName}/toggle")
    public Mono<ResponseEntity<ApiResponse<FeatureConfig>>> toggleFeature(
            @PathVariable Integer organizationId,
            @PathVariable String featureName) {
        return organizationService.toggleFeature(organizationId, featureName)
                .map(updated -> ResponseEntity.ok(new ApiResponse<>("Feature toggled successfully", updated)));
    }

    @GetMapping("/{organizationId}/features-config/privacy")
    public Mono<ResponseEntity<ApiResponse<FeatureConfig.PrivacySettings>>> getPrivacySettings(
            @PathVariable Integer organizationId) {
        return organizationService.getPrivacySettings(organizationId)
                .map(v -> ResponseEntity.ok(new ApiResponse<>("Fetched successfully", v)));
    }

    @PutMapping("/{organizationId}/features-config/privacy")
    public Mono<ResponseEntity<ApiResponse<FeatureConfig>>> updatePrivacySettings(
            @PathVariable Integer organizationId,
            @RequestBody FeatureConfig.PrivacySettings privacySettings) {
        return organizationService.updatePrivacySettings(organizationId, privacySettings)
                .map(updated -> ResponseEntity.ok(new ApiResponse<>("Updated successfully", updated)));
    }
}
