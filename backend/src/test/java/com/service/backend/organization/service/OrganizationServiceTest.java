package com.service.backend.organization.service;

import com.service.backend.organization.dao.OrganizationIntroductionRepository;
import com.service.backend.organization.dao.SchoolFeedbackRepository;
import com.service.backend.organization.dao.OrganizationRepository;
import com.service.backend.organization.dto.CreateSchoolFeedbackRequest;
import com.service.backend.shared.entity.Organization;
import com.service.backend.shared.entity.SchoolFeedback;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.utils.CacheUtils;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("OrganizationService Unit Tests")
class OrganizationServiceTest {

    @Mock private OrganizationRepository organizationRepository;
    @Mock private SchoolFeedbackRepository schoolFeedbackRepository;
    @Mock private OrganizationIntroductionRepository introductionRepository;
    @Mock private CacheUtils cacheUtils;

    @InjectMocks
    private OrganizationService organizationService;

    // ─── getOrganizationById ──────────────────────────────────────────────────

    @Nested
    @DisplayName("getOrganizationById()")
    class GetOrganizationById {

        @Test
        @DisplayName("should return organization when found in cache")
        void getOrganizationById_fromCache() {
            Organization org = Organization.builder()
                    .id(1)
                    .name("HCMUS")
                    .slug("hcmus")
                    .build();

            when(cacheUtils.getOrCompute(anyString(), anyString(), any(Duration.class), any()))
                    .thenReturn(Mono.just(org));

            StepVerifier.create(organizationService.getOrganizationById(1))
                    .assertNext(o -> assertThat(o.getName()).isEqualTo("HCMUS"))
                    .verifyComplete();
        }

        @Test
        @DisplayName("should return organization from db when not cached")
        void getOrganizationById_fromDb() {
            Organization org = Organization.builder()
                    .id(1)
                    .name("HCMUS")
                    .slug("hcmus")
                    .build();

            when(cacheUtils.getOrCompute(anyString(), anyString(), any(Duration.class), any()))
                    .thenAnswer(inv -> {
                        return ((java.util.function.Supplier<Mono<Organization>>) inv.getArgument(3)).get();
                    });
            when(organizationRepository.findById(1)).thenReturn(Mono.just(org));

            StepVerifier.create(organizationService.getOrganizationById(1))
                    .assertNext(o -> assertThat(o.getName()).isEqualTo("HCMUS"))
                    .verifyComplete();
        }

        @Test
        @DisplayName("should fail when organization not found")
        void getOrganizationById_notFound() {
            when(cacheUtils.getOrCompute(anyString(), anyString(), any(Duration.class), any()))
                    .thenAnswer(inv -> ((java.util.function.Supplier<Mono<Organization>>) inv.getArgument(3)).get());
            when(organizationRepository.findById(99)).thenReturn(Mono.empty());

            StepVerifier.create(organizationService.getOrganizationById(99))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.ORGANIZATION_NOT_FOUND)
                    .verify();
        }
    }

    // ─── getOrganizationBySlug ────────────────────────────────────────────────

    @Nested
    @DisplayName("getOrganizationBySlug()")
    class GetOrganizationBySlug {

        @Test
        @DisplayName("should return organization when found by slug")
        void getOrganizationBySlug_success() {
            Organization org = Organization.builder()
                    .id(1)
                    .name("HCMUS")
                    .slug("hcmus")
                    .build();

            when(cacheUtils.getOrCompute(anyString(), anyString(), any(Duration.class), any()))
                    .thenAnswer(inv -> ((java.util.function.Supplier<Mono<Organization>>) inv.getArgument(3)).get());
            when(organizationRepository.findBySlug("hcmus")).thenReturn(Mono.just(org));

            StepVerifier.create(organizationService.getOrganizationBySlug("hcmus"))
                    .assertNext(o -> assertThat(o.getSlug()).isEqualTo("hcmus"))
                    .verifyComplete();
        }

        @Test
        @DisplayName("should fail when no organization found for slug")
        void getOrganizationBySlug_notFound() {
            when(cacheUtils.getOrCompute(anyString(), anyString(), any(Duration.class), any()))
                    .thenAnswer(inv -> ((java.util.function.Supplier<Mono<Organization>>) inv.getArgument(3)).get());
            when(organizationRepository.findBySlug("invalid")).thenReturn(Mono.empty());

            StepVerifier.create(organizationService.getOrganizationBySlug("invalid"))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.ORGANIZATION_NOT_FOUND)
                    .verify();
        }
    }

    // ─── getAllOrganizations ───────────────────────────────────────────────────

    @Nested
    @DisplayName("getAllOrganizations()")
    class GetAllOrganizations {

        @Test
        @DisplayName("should return all organizations")
        void getAllOrganizations_success() {
            Organization org1 = Organization.builder().id(1).name("Org1").build();
            Organization org2 = Organization.builder().id(2).name("Org2").build();

            when(cacheUtils.getOrCompute(anyString(), anyString(), any(Duration.class), any()))
                    .thenAnswer(inv -> ((java.util.function.Supplier<Mono<java.util.List<Organization>>>) inv.getArgument(3)).get());
            when(organizationRepository.findAll()).thenReturn(Flux.just(org1, org2));

            StepVerifier.create(organizationService.getAllOrganizations())
                    .assertNext(o -> assertThat(o.getName()).isEqualTo("Org1"))
                    .assertNext(o -> assertThat(o.getName()).isEqualTo("Org2"))
                    .verifyComplete();
        }

        @Test
        @DisplayName("should return empty when no organizations")
        void getAllOrganizations_empty() {
            when(cacheUtils.getOrCompute(anyString(), anyString(), any(Duration.class), any()))
                    .thenAnswer(inv -> ((java.util.function.Supplier<Mono<java.util.List<Organization>>>) inv.getArgument(3)).get());
            when(organizationRepository.findAll()).thenReturn(Flux.empty());

            StepVerifier.create(organizationService.getAllOrganizations())
                    .verifyComplete();
        }
    }

    // ─── createSchoolFeedback ─────────────────────────────────────────────────

    @Nested
    @DisplayName("createSchoolFeedback()")
    class CreateSchoolFeedback {

        @Test
        @DisplayName("should create school feedback successfully")
        void createSchoolFeedback_success() {
            CreateSchoolFeedbackRequest request = new CreateSchoolFeedbackRequest();
            request.setContent("Great school!");
            request.setFullName("Student Name");

            SchoolFeedback saved = SchoolFeedback.builder()
                    .id(1)
                    .organizationId(1)
                    .content("Great school!")
                    .fullName("Student Name")
                    .build();

            Organization org = Organization.builder()
                    .id(1)
                    .name("HCMUS")
                    .slug("hcmus")
                    .build();

            when(cacheUtils.getOrCompute(anyString(), anyString(), any(Duration.class), any()))
                    .thenAnswer(inv -> ((java.util.function.Supplier<Mono<Organization>>) inv.getArgument(3)).get());
            when(organizationRepository.findById(1)).thenReturn(Mono.just(org));
            when(schoolFeedbackRepository.save(any())).thenReturn(Mono.just(saved));

            StepVerifier.create(organizationService.createSchoolFeedback(1, request))
                    .assertNext(fb -> {
                        assertThat(fb.getContent()).isEqualTo("Great school!");
                        assertThat(fb.getFullName()).isEqualTo("Student Name");
                    })
                    .verifyComplete();
        }
    }
}
