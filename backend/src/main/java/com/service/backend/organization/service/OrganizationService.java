package com.service.backend.organization.service;

import java.util.List;

import com.service.backend.organization.dao.OrganizationIntroductionRepository;
import com.service.backend.organization.dto.CreateSchoolFeedbackRequest;
import com.service.backend.organization.dto.OrgIntroductionMemberResponse;
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
import com.service.backend.shared.utils.CacheUtils;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import java.time.Duration;

@Service
@RequiredArgsConstructor
public class OrganizationService {

    private static final Logger logger = LoggerFactory.getLogger(OrganizationService.class);
    private static final String ORG_CACHE = "organization_cache";
    private final OrganizationRepository organizationRepository;
    private final SchoolFeedbackRepository schoolFeedbackRepository;
    private final OrganizationIntroductionRepository introductionRepository;
    private final CacheUtils cacheUtils;

    public Mono<Organization> getOrganizationById(Integer id) {
        logger.info("Fetching organization with id: {}", id);
        return cacheUtils.getOrCompute(ORG_CACHE, "id:" + id, Duration.ofDays(1), () ->
                organizationRepository.findById(id)
                        .doOnNext(org -> logger.info("Organization found with id: {}, name: {}", id, org.getName()))
                        .switchIfEmpty(Mono.defer(() -> {
                            logger.warn("Organization not found with id: {}", id);
                            return Mono.error(new ApplicationException(
                                    ErrorCode.ORGANIZATION_NOT_FOUND,
                                    "Organization not found with id: " + id
                            ));
                        }))
        )
                .doOnSuccess(org -> logger.info("getOrganizationById result: {}", JsonUtils.toJson(org)))
                .doOnError(error -> logger.error("Failed to fetch organization with id: {}", id, error));
    }

    public Mono<Organization> getOrganizationBySlug(String slug) {
        logger.info("Fetching organization with slug: {}", slug);
        return cacheUtils.getOrCompute(ORG_CACHE, "slug:" + slug, Duration.ofDays(1), () ->
                organizationRepository.findBySlug(slug)
                        .doOnNext(org -> logger.info("Organization found with slug: {}, name: {}", slug, org.getName()))
                        .switchIfEmpty(Mono.defer(() -> {
                            logger.warn("Organization not found with slug: {}", slug);
                            return Mono.error(new ApplicationException(
                                    ErrorCode.ORGANIZATION_NOT_FOUND,
                                    "Organization not found with slug: " + slug
                            ));
                        }))
        )
                .doOnSuccess(org -> logger.info("getOrganizationBySlug result: {}", JsonUtils.toJson(org)))
                .doOnError(error -> logger.error("Failed to fetch organization with slug: {}", slug, error));
    }

    public Flux<Organization> getAllOrganizations() {
        logger.info("Fetching all organizations");
        return cacheUtils.getOrCompute(ORG_CACHE, "all", Duration.ofDays(1), () ->
                organizationRepository.findAll().collectList()
        )
                .flatMapMany(Flux::fromIterable)
                .doOnNext(org -> logger.info("Retrieved organization: id={}, name={}", org.getId(), org.getName()))
                .doOnComplete(() -> logger.info("Successfully retrieved all organizations"))
                .doOnError(error -> logger.error("Failed to fetch organizations", error));
    }

    public Mono<OrganizationIntroductionResponse> getIntroduction(Integer orgaId) {
        logger.info("Fetching introduction for organization id: {}", orgaId);
        return cacheUtils.getOrCompute(ORG_CACHE, "intro:" + orgaId, Duration.ofDays(1), () ->
                introductionRepository.findByOrgaId(orgaId)
                        .map(this::toResponse)
                        .switchIfEmpty(Mono.just(OrganizationIntroductionResponse.builder()
                                .orgaId(orgaId)
                                .content(null)
                                .imageUrls(List.of())
                                .leaders(List.of())
                                .teamMembers(List.of())
                                .build()))
        )
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
                .imageUrls(parseStringList(intro.getImageUrls()))
                .leaders(parseMemberList(intro.getLeaders()))
                .teamMembers(parseMemberList(intro.getTeamMembers()))
                .leadersContent(intro.getLeadersContent())
                .teamMembersContent(intro.getTeamMembersContent())
                .updatedAt(intro.getUpdatedAt())
                .build();
    }

    private List<String> parseStringList(String json) {
        if (json == null || json.trim().isEmpty()) {
            return List.of();
        }
        if (!JsonUtils.isJsonArray(json)) {
            return List.of(json);
        }
        try {
            return JsonUtils.fromJsonToList(json, String.class);
        } catch (Exception e) {
            logger.error("Failed to parse string list: {}", json, e);
            return List.of();
        }
    }

    private List<OrgIntroductionMemberResponse> parseMemberList(String json) {
        if (json == null || json.trim().isEmpty()) {
            return List.of();
        }
        if (!JsonUtils.isJsonArray(json)) {
            return List.of(OrgIntroductionMemberResponse.builder()
                    .name(json)
                    .build());
        }
        try {
            return JsonUtils.fromJsonToList(json, OrgIntroductionMemberResponse.class);
        } catch (Exception e) {
            // Fallback for list of strings
            try {
                List<String> strings = JsonUtils.fromJsonToList(json, String.class);
                return strings.stream()
                        .map(s -> OrgIntroductionMemberResponse.builder().name(s).build())
                        .toList();
            } catch (Exception ex) {
                logger.error("Failed to parse member list: {}", json, ex);
                return List.of();
            }
        }
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
        return cacheUtils.getOrCompute(ORG_CACHE, "trustedVerifiers:" + organizationId, Duration.ofDays(1), () ->
                organizationRepository.findTrustedVerifiersByOrganizationId(organizationId).collectList()
        )
                .flatMapMany(Flux::fromIterable)
                .doOnComplete(() -> logger.info("Successfully fetched trusted verifiers for organization id: {}", organizationId))
                .doOnError(error -> logger.error("Failed to fetch trusted verifiers for organization id: {}", organizationId, error));
    }
}
