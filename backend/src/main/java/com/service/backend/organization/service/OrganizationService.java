package com.service.backend.organization.service;

import com.service.backend.organization.entity.Organization;
import com.service.backend.organization.dao.OrganizationRepository;
import com.service.backend.shared.constants.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class OrganizationService {

    private static final Logger logger = LoggerFactory.getLogger(OrganizationService.class);
    private final OrganizationRepository organizationRepository;

    public Mono<Organization> getOrganizationById(Long id) {
        logger.info("Fetching organization with id: {}", id);
        return organizationRepository.findById(id)
                .doOnNext(org -> logger.info("Organization found with id: {}, name: {}", id, org.getName()))
                .switchIfEmpty(Mono.error(new ApplicationException(
                        ErrorCode.ORGANIZATION_NOT_FOUND,
                        "Organization not found with id: " + id
                )))
                .doOnError(error -> logger.error("Failed to fetch organization with id: {}", id, error));
    }

    public Mono<Organization> getOrganizationBySlug(String slug) {
        logger.info("Fetching organization with slug: {}", slug);
        return organizationRepository.findBySlug(slug)
                .doOnNext(org -> logger.info("Organization found with slug: {}, name: {}", slug, org.getName()))
                .switchIfEmpty(Mono.error(new ApplicationException(
                        ErrorCode.ORGANIZATION_NOT_FOUND,
                        "Organization not found with slug: " + slug
                )))
                .doOnError(error -> logger.error("Failed to fetch organization with slug: {}", slug, error));
    }

    public Flux<Organization> getAllOrganizations() {
        logger.info("Fetching all organizations");
        return organizationRepository.findAll()
                .doOnNext(org -> logger.debug("Retrieved organization: id={}, name={}", org.getId(), org.getName()))
                .doOnComplete(() -> logger.info("Successfully retrieved all organizations"))
                .doOnError(error -> logger.error("Failed to fetch organizations", error));
    }
}