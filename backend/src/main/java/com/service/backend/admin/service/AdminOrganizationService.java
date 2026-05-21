package com.service.backend.admin.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.service.backend.admin.dto.UpdateOrganizationRequest;
import com.service.backend.admin.dto.UpsertOrganizationIntroductionRequest;
import com.service.backend.admin.dto.config.FeatureConfig;
import com.service.backend.organization.dao.OrganizationIntroductionRepository;
import com.service.backend.organization.dao.SchoolFeedbackRepository;
import com.service.backend.organization.dto.OrganizationIntroductionResponse;
import com.service.backend.organization.entity.Organization;
import com.service.backend.organization.entity.OrganizationIntroduction;
import com.service.backend.organization.entity.SchoolFeedback;
import com.service.backend.admin.dao.AdminOrganizationRepository;
import com.service.backend.shared.constants.ErrorCode;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.service.ImageService;
import com.service.backend.shared.utils.JsonUtils;
import reactor.core.publisher.Flux;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class AdminOrganizationService {
    private static final Logger logger = LoggerFactory.getLogger(AdminOrganizationService.class);
    
    private final AdminOrganizationRepository organizationRepository;
    private final SchoolFeedbackRepository schoolFeedbackRepository;
    private final OrganizationIntroductionRepository introductionRepository;
    private final ImageService imageService;
    
    /**
     * Get all organizations with pagination and search
     */
    public Mono<PaginatedResponse<Organization>> getAllOrganizations(int page, int size, String search) {
        logger.info("Fetching organizations - search: {}, page: {}, size: {}", search, page, size);
        int offset = page * size;
        String searchParam = (search != null && !search.trim().isEmpty()) ? "%" + search.trim() + "%" : null;

        return Mono.zip(
                organizationRepository.findAllWithFilters(searchParam, offset, size).collectList(),
                organizationRepository.countWithFilters(searchParam)
        ).map(tuple -> {
            logger.info("Organizations fetched successfully - total: {}", tuple.getT2());
            return PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, size);
        })
        .doOnError(error -> logger.error("Failed to fetch organizations - search: {}, page: {}, size: {}", search, page, size, error));
    }
    
    /**
     * Get organization by ID
     */
    public Mono<Organization> getOrganizationById(Integer organizationId) {
        logger.info("Fetching organization by ID: {}", organizationId);
        return organizationRepository.findById(organizationId)
                .doOnSuccess(org -> logger.info("Organization fetched successfully - ID: {}", organizationId))
                .doOnError(error -> logger.error("Failed to fetch organization - ID: {}", organizationId, error));
    }

    public Mono<List<String>> getPrograms(Integer organizationId) {
        return requireOrganization(organizationId).map(org -> parseOptions(org.getPrograms()));
    }

    public Mono<List<String>> addProgram(Integer organizationId, String value) {
        return appendOption(organizationId, value, true);
    }

    public Mono<List<String>> updateProgram(Integer organizationId, String oldValue, String newValue) {
        return replaceOption(organizationId, oldValue, newValue, true);
    }

    public Mono<List<String>> removeProgram(Integer organizationId, String value) {
        return deleteOption(organizationId, value, true);
    }

    public Mono<List<String>> getMajors(Integer organizationId) {
        return requireOrganization(organizationId).map(org -> parseOptions(org.getMajors()));
    }

    public Mono<List<String>> addMajor(Integer organizationId, String value) {
        return appendOption(organizationId, value, false);
    }

    public Mono<List<String>> updateMajor(Integer organizationId, String oldValue, String newValue) {
        return replaceOption(organizationId, oldValue, newValue, false);
    }

    public Mono<List<String>> removeMajor(Integer organizationId, String value) {
        return deleteOption(organizationId, value, false);
    }
    
    /**
     * Get organization by slug
     */
    public Mono<Organization> getOrganizationBySlug(String slug) {
        logger.info("Fetching organization by slug: {}", slug);
        return organizationRepository.findBySlug(slug)
                .doOnSuccess(org -> logger.info("Organization fetched successfully - slug: {}", slug))
                .doOnError(error -> logger.error("Failed to fetch organization - slug: {}", slug, error));
    }
    
    /**
     * Create new organization
     */
    public Mono<Organization> createOrganization(UpdateOrganizationRequest request) {
        logger.info("Creating new organization: {}", request.getName());
        Organization organization = Organization.builder()
                .name(request.getName())
                .slug(request.getSlug())
                .logoUrl(request.getLogoUrl())
                .status(request.getStatus() != null ? request.getStatus() : "ACTIVE")
                .featuresConfig(request.getFeaturesConfig())
                .programs(JsonUtils.toJson(request.getPrograms()))
                .majors(JsonUtils.toJson(request.getMajors()))
                .createdAt(LocalDateTime.now())
                .build();
        
        return organizationRepository.save(organization)
                .doOnSuccess(saved -> logger.info("Organization created successfully - ID: {}, Name: {}", saved.getId(), saved.getName()))
                .doOnError(error -> logger.error("Failed to create organization: {}", request.getName(), error));
    }
    
    /**
     * Update organization
     */
    public Mono<Organization> updateOrganization(Integer organizationId, UpdateOrganizationRequest organizationUpdate) {
        logger.info("Updating organization with ID: {}", organizationId);
        return organizationRepository.findById(organizationId)
                .flatMap(existing -> {
                    String name = organizationUpdate.getName() != null ? organizationUpdate.getName() : existing.getName();
                    String slug = organizationUpdate.getSlug() != null ? organizationUpdate.getSlug() : existing.getSlug();
                    String logoUrl = organizationUpdate.getLogoUrl() != null ? organizationUpdate.getLogoUrl() : existing.getLogoUrl();
                    String status = organizationUpdate.getStatus() != null ? organizationUpdate.getStatus() : existing.getStatus();
                    String brandConfig = existing.getBrandConfig(); // Keep existing if not in DTO
                    String featuresConfig = organizationUpdate.getFeaturesConfig() != null ? organizationUpdate.getFeaturesConfig() : existing.getFeaturesConfig();
                    String programs = organizationUpdate.getPrograms() != null ? JsonUtils.toJson(organizationUpdate.getPrograms()) : existing.getPrograms();
                    String majors = organizationUpdate.getMajors() != null ? JsonUtils.toJson(organizationUpdate.getMajors()) : existing.getMajors();

                    return organizationRepository.updateOrganizationFields(
                            organizationId, name, slug, logoUrl, status, brandConfig, featuresConfig, programs, majors
                    ).flatMap(rows -> organizationRepository.findById(organizationId))
                    .doOnSuccess(saved -> logger.info("Organization updated successfully - ID: {}", organizationId));
                })
                .doOnError(error -> logger.error("Failed to update organization - ID: {}", organizationId, error));
    }
    
    /**
     * Delete organization
     */
    public Mono<Boolean> deleteOrganization(Integer organizationId) {
        logger.info("Deleting organization with ID: {}", organizationId);
        return organizationRepository.deleteById(organizationId)
                .then(Mono.just(true))
                .doOnSuccess(success -> logger.info("Organization deleted successfully - ID: {}", organizationId))
                .onErrorResume(error -> {
                    logger.error("Failed to delete organization - ID: {}", organizationId, error);
                    return Mono.just(false);
                });
    }

    public Mono<PaginatedResponse<SchoolFeedback>> getSchoolFeedbacks(Integer organizationId, int page, int size) {
        logger.info("Fetching school feedbacks - organizationId: {}, page: {}, size: {}", organizationId, page, size);
        int offset = page * size;
        return Mono.zip(
                schoolFeedbackRepository.findByOrganizationIdWithPagination(organizationId, offset, size).collectList(),
                schoolFeedbackRepository.countByOrganizationId(organizationId)
        ).map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, size))
                .doOnError(error -> logger.error("Failed to fetch school feedbacks", error));
    }

    public Mono<Void> markSchoolFeedbackAsRead(Integer feedbackId) {
        logger.info("Marking school feedback as read - feedbackId: {}", feedbackId);
        return schoolFeedbackRepository.markAsRead(feedbackId)
                .flatMap(updatedRows -> {
                    if (updatedRows == null || updatedRows <= 0) {
                        return Mono.error(new ApplicationException(
                                ErrorCode.RESOURCES_NOT_FOUND,
                                "School feedback not found"));
                    }
                    return Mono.empty();
                });
    }

    public Mono<OrganizationIntroductionResponse> upsertIntroduction(
            Integer orgaId, UpsertOrganizationIntroductionRequest request) {
        logger.info("Upserting introduction for organization id: {}", orgaId);
        Mono<List<String>> uploadedUrls = uploadImages(request.getImages());
        return requireOrganization(orgaId)
                .flatMap(org -> uploadedUrls)
                .flatMap(urls -> introductionRepository.findByOrgaId(orgaId)
                        .defaultIfEmpty(OrganizationIntroduction.builder().orgaId(orgaId).build())
                        .flatMap(intro -> {
                            String imageUrlsJson = JsonUtils.toJson(urls);
                            if (intro.getId() != null) {
                                return introductionRepository.updateFields(
                                        orgaId, 
                                        request.getContent(), 
                                        request.getVision(),
                                        request.getMission(),
                                        request.getCoreValues(),
                                        request.getBannerUrl(),
                                        imageUrlsJson
                                )
                                .then(introductionRepository.findByOrgaId(orgaId))
                                .thenReturn(urls);
                            } else {
                                intro.setContent(request.getContent());
                                intro.setVision(request.getVision());
                                intro.setMission(request.getMission());
                                intro.setCoreValues(request.getCoreValues());
                                intro.setImageUrls(imageUrlsJson);
                                intro.setBannerUrl(request.getBannerUrl());
                                return introductionRepository.save(intro).thenReturn(urls);
                            }
                        }))
                .map(urls -> OrganizationIntroductionResponse.builder()
                        .orgaId(orgaId)
                        .content(request.getContent())
                        .vision(request.getVision())
                        .mission(request.getMission())
                        .coreValues(request.getCoreValues())
                        .imageUrls(urls)
                        .bannerUrl(request.getBannerUrl())
                        .build())
                .doOnError(error -> logger.error("Failed to upsert introduction for organization id: {}", orgaId, error));
    }

    private Mono<List<String>> uploadImages(List<String> base64Images) {
        if (base64Images == null || base64Images.isEmpty()) {
            return Mono.just(List.of());
        }
        return Flux.fromIterable(base64Images)
                .flatMapSequential(imageService::uploadBase64IfPresent)
                .collectList();
    }

    public Mono<FeatureConfig> getConfig(Integer organizationId) {
        return requireOrganization(organizationId)
                .map(org -> parseConfig(org.getFeaturesConfig()));
    }

    public Mono<FeatureConfig> updateConfig(Integer organizationId, FeatureConfig config) {
        return requireOrganization(organizationId)
                .flatMap(org -> {
                    org.setFeaturesConfig(JsonUtils.toJson(config));
                    return organizationRepository.save(org).thenReturn(config);
                });
    }

    public Mono<FeatureConfig.SiteIdentity> getSiteIdentity(Integer organizationId) {
        return requireOrganization(organizationId)
                .map(org -> parseConfig(org.getFeaturesConfig()).getSiteIdentity());
    }

    public Mono<FeatureConfig> updateSiteIdentity(Integer organizationId, FeatureConfig.SiteIdentity siteIdentity) {
        return requireOrganization(organizationId)
                .flatMap(org -> {
                    FeatureConfig config = parseConfig(org.getFeaturesConfig());
                    config.setSiteIdentity(siteIdentity);
                    org.setFeaturesConfig(JsonUtils.toJson(config));
                    return organizationRepository.save(org).thenReturn(config);
                });
    }

    public Mono<FeatureConfig.BrandConfig> getBrandConfig(Integer organizationId) {
        return requireOrganization(organizationId)
                .map(org -> parseConfig(org.getFeaturesConfig()).getBrandConfig());
    }

    public Mono<FeatureConfig> updateBrandConfig(Integer organizationId, FeatureConfig.BrandConfig brandConfig) {
        return requireOrganization(organizationId)
                .flatMap(org -> {
                    FeatureConfig config = parseConfig(org.getFeaturesConfig());
                    config.setBrandConfig(brandConfig);
                    org.setFeaturesConfig(JsonUtils.toJson(config));
                    return organizationRepository.save(org).thenReturn(config);
                });
    }

    public Mono<Map<String, FeatureConfig.Feature>> getFeatures(Integer organizationId) {
        return requireOrganization(organizationId)
                .map(org -> {
                    Map<String, FeatureConfig.Feature> features =
                            parseConfig(org.getFeaturesConfig()).getFeaturesConfig();
                    return features != null ? features : new HashMap<>();
                });
    }

    public Mono<FeatureConfig> updateFeatures(Integer organizationId,
            Map<String, FeatureConfig.Feature> featuresConfig) {
        return requireOrganization(organizationId)
                .flatMap(org -> {
                    FeatureConfig config = parseConfig(org.getFeaturesConfig());
                    config.setFeaturesConfig(featuresConfig);
                    org.setFeaturesConfig(JsonUtils.toJson(config));
                    return organizationRepository.save(org).thenReturn(config);
                });
    }

    public Mono<FeatureConfig.Feature> getFeature(Integer organizationId, String featureName) {
        return requireOrganization(organizationId)
                .map(org -> requireFeature(parseConfig(org.getFeaturesConfig()), featureName));
    }

    public Mono<FeatureConfig> updateFeature(Integer organizationId, String featureName,
            FeatureConfig.Feature patch) {
        return requireOrganization(organizationId)
                .flatMap(org -> {
                    FeatureConfig config = parseConfig(org.getFeaturesConfig());
                    FeatureConfig.Feature feature = requireFeature(config, featureName);
                    if (patch.getEnabled() != null) feature.setEnabled(patch.getEnabled());
                    if (patch.getSettings() != null) feature.setSettings(patch.getSettings());
                    config.getFeaturesConfig().put(featureName, feature);
                    org.setFeaturesConfig(JsonUtils.toJson(config));
                    return organizationRepository.save(org).thenReturn(config);
                });
    }

    public Mono<FeatureConfig> toggleFeature(Integer organizationId, String featureName) {
        return requireOrganization(organizationId)
                .flatMap(org -> {
                    FeatureConfig config = parseConfig(org.getFeaturesConfig());
                    FeatureConfig.Feature feature = requireFeature(config, featureName);
                    feature.setEnabled(!Boolean.TRUE.equals(feature.getEnabled()));
                    config.getFeaturesConfig().put(featureName, feature);
                    org.setFeaturesConfig(JsonUtils.toJson(config));
                    return organizationRepository.save(org).thenReturn(config);
                });
    }

    public Mono<FeatureConfig.PrivacySettings> getPrivacySettings(Integer organizationId) {
        return requireOrganization(organizationId)
                .map(org -> parseConfig(org.getFeaturesConfig()).getPrivacySettings());
    }

    public Mono<FeatureConfig> updatePrivacySettings(Integer organizationId,
            FeatureConfig.PrivacySettings privacySettings) {
        return requireOrganization(organizationId)
                .flatMap(org -> {
                    FeatureConfig config = parseConfig(org.getFeaturesConfig());
                    config.setPrivacySettings(privacySettings);
                    org.setFeaturesConfig(JsonUtils.toJson(config));
                    return organizationRepository.save(org).thenReturn(config);
                });
    }

    private Mono<Organization> requireOrganization(Integer organizationId) {
        return organizationRepository.findById(organizationId)
                .switchIfEmpty(Mono.error(new ApplicationException(
                        ErrorCode.ORGANIZATION_NOT_FOUND,
                        "Organization not found with id: " + organizationId)));
    }

    private Mono<List<String>> appendOption(Integer organizationId, String rawValue, boolean isProgram) {
        String normalizedValue = normalizeOption(rawValue);
        String fieldName = isProgram ? "program" : "major";
        return requireOrganization(organizationId)
                .flatMap(organization -> {
                    List<String> options = parseOptions(isProgram ? organization.getPrograms() : organization.getMajors());
                    if (containsIgnoreCase(options, normalizedValue)) {
                        return Mono.error(new ApplicationException(
                                ErrorCode.RESOURCES_DUPLICATE,
                                "The " + fieldName + " already exists"));
                    }
                    options.add(normalizedValue);
                    writeOptions(organization, options, isProgram);
                    return organizationRepository.save(organization)
                            .thenReturn(options);
                });
    }

    private Mono<List<String>> replaceOption(Integer organizationId, String oldRawValue, String newRawValue, boolean isProgram) {
        String oldValue = normalizeOption(oldRawValue);
        String newValue = normalizeOption(newRawValue);
        String fieldName = isProgram ? "program" : "major";
        return requireOrganization(organizationId)
                .flatMap(organization -> {
                    List<String> options = parseOptions(isProgram ? organization.getPrograms() : organization.getMajors());
                    int oldIndex = indexOfIgnoreCase(options, oldValue);
                    if (oldIndex < 0) {
                        return Mono.error(new ApplicationException(
                                ErrorCode.RESOURCES_NOT_FOUND,
                                "The " + fieldName + " does not exist"));
                    }

                    int duplicateIndex = indexOfIgnoreCase(options, newValue);
                    if (duplicateIndex >= 0 && duplicateIndex != oldIndex) {
                        return Mono.error(new ApplicationException(
                                ErrorCode.RESOURCES_DUPLICATE,
                                "The " + fieldName + " already exists"));
                    }

                    options.set(oldIndex, newValue);
                    writeOptions(organization, options, isProgram);
                    return organizationRepository.save(organization)
                            .thenReturn(options);
                });
    }

    private Mono<List<String>> deleteOption(Integer organizationId, String rawValue, boolean isProgram) {
        String normalizedValue = normalizeOption(rawValue);
        String fieldName = isProgram ? "program" : "major";
        return requireOrganization(organizationId)
                .flatMap(organization -> {
                    List<String> options = parseOptions(isProgram ? organization.getPrograms() : organization.getMajors());
                    int targetIndex = indexOfIgnoreCase(options, normalizedValue);
                    if (targetIndex < 0) {
                        return Mono.error(new ApplicationException(
                                ErrorCode.RESOURCES_NOT_FOUND,
                                "The " + fieldName + " does not exist"));
                    }

                    options.remove(targetIndex);
                    writeOptions(organization, options, isProgram);
                    return organizationRepository.save(organization)
                            .thenReturn(options);
                });
    }

    private List<String> parseOptions(String rawValue) {
        if (rawValue == null || rawValue.isBlank()) {
            return new ArrayList<>();
        }

        try {
            List<String> parsed = JsonUtils.fromJsonToList(rawValue, String.class);
            if (parsed == null) {
                return new ArrayList<>();
            }
            List<String> normalized = new ArrayList<>();
            for (String item : parsed) {
                String trimmed = item == null ? "" : item.trim();
                if (!trimmed.isEmpty()) {
                    normalized.add(trimmed);
                }
            }
            return normalized;
        } catch (RuntimeException ex) {
            List<String> fallback = new ArrayList<>();
            Collections.addAll(fallback, rawValue.split(","));
            fallback.replaceAll(value -> value == null ? "" : value.trim());
            fallback.removeIf(String::isBlank);
            return fallback;
        }
    }

    private void writeOptions(Organization organization, List<String> options, boolean isProgram) {
        String json = JsonUtils.toJson(options);
        if (isProgram) {
            organization.setPrograms(json);
        } else {
            organization.setMajors(json);
        }
    }

    private String normalizeOption(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Option value is required");
        }
        return value.trim();
    }

    private boolean containsIgnoreCase(List<String> values, String target) {
        return indexOfIgnoreCase(values, target) >= 0;
    }

    private int indexOfIgnoreCase(List<String> values, String target) {
        for (int i = 0; i < values.size(); i++) {
            if (values.get(i).equalsIgnoreCase(target)) {
                return i;
            }
        }
        return -1;
    }

    private FeatureConfig parseConfig(String raw) {
        if (raw == null || raw.isBlank()) return new FeatureConfig();
        return JsonUtils.fromJson(raw, FeatureConfig.class);
    }

    private FeatureConfig.Feature requireFeature(FeatureConfig config, String featureName) {
        Map<String, FeatureConfig.Feature> features = config.getFeaturesConfig();
        if (features == null || !features.containsKey(featureName)) {
            throw new ApplicationException(ErrorCode.RESOURCES_NOT_FOUND,
                    "Feature not found: " + featureName);
        }
        return features.get(featureName);
    }
}
