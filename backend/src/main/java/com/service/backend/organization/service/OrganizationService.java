package com.service.backend.organization.service;

import com.service.backend.organization.entity.Organization;
import com.service.backend.organization.dao.OrganizationRepository;
import com.service.backend.shared.constants.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class OrganizationService {

    private final OrganizationRepository organizationRepository;

    public Mono<Organization> getOrganizationById(Long id) {
        return organizationRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(
                        ErrorCode.ORGANIZATION_NOT_FOUND,
                        "Organization not found with id: " + id
                )));
    }

    public Mono<Organization> getOrganizationBySlug(String slug) {
        return organizationRepository.findBySlug(slug)
                .switchIfEmpty(Mono.error(new ApplicationException(
                        ErrorCode.ORGANIZATION_NOT_FOUND,
                        "Organization not found with slug: " + slug
                )));
    }

    public Flux<Organization> getAllOrganizations() {
        return organizationRepository.findAll();
    }
}
