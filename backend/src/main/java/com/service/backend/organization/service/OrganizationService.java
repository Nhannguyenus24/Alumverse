package com.service.backend.organization.service;

import java.util.List;

import com.service.backend.organization.dao.OrganizationIntroductionRepository;
import com.service.backend.organization.dto.CreateSchoolFeedbackRequest;
import com.service.backend.organization.dto.OrganizationIntroductionResponse;
import com.service.backend.organization.dto.TrustedVerifierResponse;
import com.service.backend.shared.entity.OrganizationIntroduction;
import com.service.backend.shared.entity.SchoolFeedback;
import com.service.backend.shared.entity.Organization;
import com.service.backend.organization.dao.OrganizationRepository;
import com.service.backend.organization.dao.SchoolFeedbackRepository;
import com.service.backend.shared.enums.ErrorCode;
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
        logger.info("Fetching organization with id: {}", id);
        return organizationRepository.findById(id)
                .doOnNext(org -> logger.info("Organization found with id: {}, name: {}", id, org.getName()))
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
        logger.info("Fetching organization with slug: {}", slug);
        return organizationRepository.findBySlug(slug)
                .doOnNext(org -> logger.info("Organization found with slug: {}, name: {}", slug, org.getName()))
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
        logger.info("Fetching all organizations");
        return organizationRepository.findAll()
                .doOnNext(org -> logger.info("Retrieved organization: id={}, name={}", org.getId(), org.getName()))
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
                        .leaders(List.of())
                        .teamMembers(List.of())
                        .build()))
                .doOnSuccess(r -> logger.info("getIntroduction result: {}", JsonUtils.toJson(r)))
                .doOnError(error -> logger.error("Failed to fetch introduction for organization id: {}", orgaId, error));
    }

    private OrganizationIntroductionResponse toResponse(OrganizationIntroduction intro) {
        return OrganizationIntroductionResponse.builder()
                .orgaId(intro.getOrgaId())
                .content(intro.getContent())
                .vision(intro.getVision())
                .mission(intro.getMission())
                .coreValues(intro.getCoreValues())
                .bannerUrl(intro.getBannerUrl())
                .imageUrls(parseJsonList(intro.getImageUrls()))
                .leaders(parseJsonList(intro.getLeaders()))
                .teamMembers(parseJsonList(intro.getTeamMembers()))
                .leadersContent(intro.getLeadersContent())
                .teamMembersContent(intro.getTeamMembersContent())
                .updatedAt(intro.getUpdatedAt())
                .build();
    }

    private List<String> parseJsonList(String json) {
        if (json == null) {
            return List.of();
        }
        return JsonUtils.isJsonArray(json)
                ? JsonUtils.fromJsonToList(json, String.class)
                : List.of();
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

    public Flux<TrustedVerifierResponse> getTrustedVerifiers(Integer organizationId) {
        logger.info("Fetching trusted verifiers for organization id: {}", organizationId);
        return organizationRepository.findTrustedVerifiersByOrganizationId(organizationId)
                .doOnComplete(() -> logger.info("Successfully fetched trusted verifiers for organization id: {}", organizationId))
                .doOnError(error -> logger.error("Failed to fetch trusted verifiers for organization id: {}", organizationId, error));
    }
}
