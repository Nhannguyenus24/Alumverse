package com.service.backend.admin.service;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;

import com.service.backend.admin.dto.OrganizationPageResponse;
import com.service.backend.admin.entities.Organization;
import com.service.backend.admin.repository.AdminOrganizationRepository;
import com.service.backend.shared.dto.PageInfo;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class AdminOrganizationService {
    
    private final AdminOrganizationRepository organizationRepository;
    
    /**
     * Get all organizations with pagination
     */
    public Mono<OrganizationPageResponse> getAllOrganizations(int page, int size) {
        int offset = page * size;
        return Mono.zip(
                organizationRepository.findAllWithPagination(offset, size).collectList(),
                organizationRepository.count()
        ).map(tuple -> {
            var organizations = tuple.getT1();
            var total = tuple.getT2();
            int totalPage = (int) Math.ceil((double) total / size);
            boolean hasNext = page < totalPage - 1;
            boolean hasPrevious = page > 0;
            
            PageInfo pageInfo = PageInfo.builder()
                    .currentPage(page)
                    .pageSize(size)
                    .totalPage(totalPage)
                    .totalItem(Math.toIntExact(total))
                    .hasNext(hasNext)
                    .hasPrevious(hasPrevious)
                    .build();
            
            return new OrganizationPageResponse(organizations, pageInfo);
        });
    }
    
    /**
     * Get organization by ID
     */
    public Mono<Organization> getOrganizationById(Integer organizationId) {
        return organizationRepository.findById(organizationId);
    }
    
    /**
     * Get organization by slug
     */
    public Mono<Organization> getOrganizationBySlug(String slug) {
        return organizationRepository.findBySlug(slug);
    }
    
    /**
     * Create new organization
     */
    public Mono<Organization> createOrganization(Organization organization) {
        organization.setCreatedAt(LocalDateTime.now());
        return organizationRepository.save(organization);
    }
    
    /**
     * Update organization
     */
    public Mono<Organization> updateOrganization(Integer organizationId, Organization organizationUpdate) {
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
                    return organizationRepository.save(existing);
                });
    }
    
    /**
     * Delete organization
     */
    public Mono<Boolean> deleteOrganization(Integer organizationId) {
        return organizationRepository.deleteById(organizationId)
                .then(Mono.just(true))
                .onErrorResume(error -> Mono.just(false));
    }
}
