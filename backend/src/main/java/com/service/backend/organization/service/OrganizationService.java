package com.service.backend.organization.service;

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

    public Mono<Organization> getOrganizationById(Integer id) {
        return organizationRepository.findById(id)
                .switchIfEmpty(Mono.defer(() -> {
                    logger.warn("Organization not found with id: {}", id);
                    return Mono.error(new ApplicationException(
                            ErrorCode.ORGANIZATION_NOT_FOUND,
                            "Organization not found with id: " + id
                    ));
                }))
                .doOnSuccess(org -> logger.info("getOrganizationById result: {}", JsonUtils.toJson(org)))
                .doOnError(error -> logger.error("Failed to fetch organization with id: {}", id, error));
    }

    public Mono<Organization> getOrganizationBySlug(String slug) {
        return organizationRepository.findBySlug(slug)
                .switchIfEmpty(Mono.defer(() -> {
                    logger.warn("Organization not found with slug: {}", slug);
                    return Mono.error(new ApplicationException(
                            ErrorCode.ORGANIZATION_NOT_FOUND,
                            "Organization not found with slug: " + slug
                    ));
                }))
                .doOnSuccess(org -> logger.info("getOrganizationBySlug result: {}", JsonUtils.toJson(org)))
                .doOnError(error -> logger.error("Failed to fetch organization with slug: {}", slug, error));
    }

    public Flux<Organization> getAllOrganizations() {
        return organizationRepository.findAll()
                .doOnError(error -> logger.error("Failed to fetch organizations", error));
    }

    public Mono<OrganizationIntroductionResponse> getIntroduction(Integer orgaId) {
        return introductionRepository.findByOrgaId(orgaId)
                .map(this::toResponse)
                .switchIfEmpty(Mono.just(OrganizationIntroductionResponse.builder()
                        .orgaId(orgaId)
                        .content(null)
                        .imageUrls(List.of())
                        .build()))
                .doOnSuccess(r -> logger.info("getIntroduction result: {}", JsonUtils.toJson(r)))
                .doOnError(error -> logger.error("Failed to fetch introduction for organization id: {}", orgaId, error));
    }

    private OrganizationIntroductionResponse toResponse(OrganizationIntroduction intro) {
        List<String> urls = intro.getImageUrls() != null
                ? JsonUtils.isJsonArray(intro.getImageUrls())
                        ? JsonUtils.fromJsonToList(intro.getImageUrls(), String.class)
                        : List.of()
                : List.of();
        return OrganizationIntroductionResponse.builder()
                .orgaId(intro.getOrgaId())
                .content(intro.getContent())
                .vision(intro.getVision())
                .mission(intro.getMission())
                .coreValues(intro.getCoreValues())
                .bannerUrl(intro.getBannerUrl())
                .imageUrls(urls)
                .build();
    }

    public Mono<SchoolFeedback> createSchoolFeedback(Integer organizationId, CreateSchoolFeedbackRequest request) {
        return getOrganizationById(organizationId)
                .flatMap(organization -> {
                    SchoolFeedback feedback = SchoolFeedback.builder()
                            .organizationId(organization.getId())
                            .fullName(request.getFullName())
                            .phone(request.getPhone())
                            .email(request.getEmail())
                            .subject(request.getSubject())
                            .content(request.getContent())
                            .isRead(false)
                            .build();

                    return schoolFeedbackRepository.save(feedback);
                })
                .doOnSuccess(feedback -> logger.info("createSchoolFeedback result: {}", JsonUtils.toJson(feedback)))
                .doOnError(error -> logger.error("Failed to create school feedback for organization id: {}", organizationId, error));
    }
}
