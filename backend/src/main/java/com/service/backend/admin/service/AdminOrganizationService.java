package com.service.backend.admin.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.service.backend.organization.entity.Organization;
import com.service.backend.admin.dao.AdminOrganizationRepository;
import com.service.backend.shared.constants.ErrorCode;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.utils.JsonUtils;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class AdminOrganizationService {
    private static final Logger logger = LoggerFactory.getLogger(AdminOrganizationService.class);
    
    private final AdminOrganizationRepository organizationRepository;
    
    /**
     * Get all organizations with pagination
     */
    public Mono<PaginatedResponse<Organization>> getAllOrganizations(int page, int size) {
        logger.info("Fetching organizations with pagination - page: {}, size: {}", page, size);
        int offset = page * size;
        return Mono.zip(
                organizationRepository.findAllWithPagination(offset, size).collectList(),
                organizationRepository.count()
        ).map(tuple -> {
            logger.info("Organizations fetched successfully - total: {}", tuple.getT2());
            return PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, size);
        })
        .doOnError(error -> logger.error("Failed to fetch organizations with pagination - page: {}, size: {}", page, size, error));
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
    public Mono<Organization> createOrganization(Organization organization) {
        logger.info("Creating new organization: {}", organization.getName());
        organization.setCreatedAt(LocalDateTime.now());
        return organizationRepository.save(organization)
                .doOnSuccess(saved -> logger.info("Organization created successfully - ID: {}, Name: {}", saved.getId(), saved.getName()))
                .doOnError(error -> logger.error("Failed to create organization: {}", organization.getName(), error));
    }
    
    /**
     * Update organization
     */
    public Mono<Organization> updateOrganization(Integer organizationId, Organization organizationUpdate) {
        logger.info("Updating organization with ID: {}", organizationId);
        return organizationRepository.findById(organizationId)
                .flatMap(existing -> {
                    if (organizationUpdate.getName() != null) {
                        existing.setName(organizationUpdate.getName());
                    }
                    if (organizationUpdate.getSlug() != null) {
                        existing.setSlug(organizationUpdate.getSlug());
                    }
                    if (organizationUpdate.getLogoUrl() != null) {
                        existing.setLogoUrl(organizationUpdate.getLogoUrl());
                    }
                    if (organizationUpdate.getBrandConfig() != null) {
                        existing.setBrandConfig(organizationUpdate.getBrandConfig());
                    }
                    if (organizationUpdate.getFeaturesConfig() != null) {
                        existing.setFeaturesConfig(organizationUpdate.getFeaturesConfig());
                    }
                    if (organizationUpdate.getPrograms() != null) {
                        existing.setPrograms(organizationUpdate.getPrograms());
                    }
                    if (organizationUpdate.getMajors() != null) {
                        existing.setMajors(organizationUpdate.getMajors());
                    }
                    return organizationRepository.save(existing)
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
}
