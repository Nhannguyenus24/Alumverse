package com.service.backend.admin.service;

import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.service.backend.organization.entity.Organization;
import com.service.backend.admin.dao.AdminOrganizationRepository;
import com.service.backend.shared.dto.PaginatedResponse;

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
}
