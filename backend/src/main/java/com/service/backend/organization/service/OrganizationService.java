package com.service.backend.organization.service;

import java.time.LocalDateTime;
import java.util.List;

import com.service.backend.organization.dao.OrganizationIntroductionRepository;
import com.service.backend.organization.dto.CreateSchoolFeedbackRequest;
import com.service.backend.organization.dto.OrganizationIntroductionResponse;
import com.service.backend.organization.entity.OrganizationIntroduction;
import com.service.backend.organization.entity.SchoolFeedback;
import com.service.backend.organization.entity.Organization;
import com.service.backend.organization.dao.OrganizationRepository;
import com.service.backend.organization.dao.SchoolFeedbackRepository;
import com.service.backend.shared.constants.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.utils.JsonUtils;
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
    private final SchoolFeedbackRepository schoolFeedbackRepository;
    private final OrganizationIntroductionRepository introductionRepository;

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

    public Mono<OrganizationIntroductionResponse> getIntroduction(Integer orgaId) {
        logger.info("Fetching introduction for organization id: {}", orgaId);
        return introductionRepository.findByOrgaId(orgaId)
                .map(this::toResponse)
                .switchIfEmpty(Mono.just(OrganizationIntroductionResponse.builder()
                        .orgaId(orgaId)
                        .content(null)
                        .imageUrls(List.of())
                        .build()))
                .doOnError(error -> logger.error("Failed to fetch introduction for organization id: {}", orgaId, error));
    }

    private OrganizationIntroductionResponse toResponse(OrganizationIntroduction intro) {
        List<String> urls = intro.getImageUrls() != null
                ? JsonUtils.fromJsonToList(intro.getImageUrls(), String.class)
                : List.of();
        return OrganizationIntroductionResponse.builder()
                .orgaId(intro.getOrgaId())
                .content(intro.getContent())
                .imageUrls(urls)
                .build();
    }

    public Mono<SchoolFeedback> createSchoolFeedback(Long organizationId, CreateSchoolFeedbackRequest request) {
        logger.info("Creating school feedback for organization id: {}", organizationId);
        return getOrganizationById(organizationId)
                .flatMap(organization -> {
                    SchoolFeedback feedback = SchoolFeedback.builder()
                            .organizationId(Math.toIntExact(organization.getId()))
                            .fullName(request.getFullName())
                            .phone(request.getPhone())
                            .email(request.getEmail())
                            .subject(request.getSubject())
                            .content(request.getContent())
                            .createdAt(LocalDateTime.now())
                            .isRead(false)
                            .build();

                    return schoolFeedbackRepository.save(feedback);
                })
                .doOnSuccess(feedback -> logger.info("Created school feedback with id: {}", feedback.getId()))
                .doOnError(error -> logger.error("Failed to create school feedback for organization id: {}", organizationId, error));
    }
}