package com.service.backend.article.service;

import com.service.backend.article.dao.JobR2dbcRepository;
import com.service.backend.article.dto.JobResponse;
import com.service.backend.shared.dto.FeaturedPaginatedResponse;
import com.service.backend.article.dto.UpdateJobRequest;
import com.service.backend.shared.entity.Job;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.service.ImageService;
import com.service.backend.shared.utils.CacheUtils;
import com.service.backend.user.service.NotificationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Flux;
import reactor.test.StepVerifier;

import java.time.LocalDate;
import java.util.function.Supplier;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("JobService Unit Tests")
class JobServiceTest {

    @Mock private JobR2dbcRepository jobRepository;
    @Mock private ImageService imageService;
    @Mock private CacheUtils cacheUtils;
    @Mock private NotificationService notificationService;

    @InjectMocks
    private JobService jobService;

    private static reactor.util.context.Context adminContext() {
        return org.springframework.security.core.context.ReactiveSecurityContextHolder.withAuthentication(
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        "1", null,
                        java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_ADMIN"))));
    }

    // ─── getById ─────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("getById()")
    class GetById {

        @Test
        @DisplayName("should return job when found")
        void getById_success() {
            Job job = Job.builder()
                    .id(1)
                    .title("Software Engineer")
                    .companyName("Tech Corp")
                    .type("full_time")
                    .isActive(true)
                    .build();

            when(jobRepository.findById(1)).thenReturn(Mono.just(job));

            StepVerifier.create(jobService.getById(1))
                    .assertNext(dto -> {
                        assertThat(dto.getTitle()).isEqualTo("Software Engineer");
                        assertThat(dto.getCompanyName()).isEqualTo("Tech Corp");
                    })
                    .verifyComplete();
        }

        @Test
        @DisplayName("should fail when job not found")
        void getById_notFound() {
            when(jobRepository.findById(99)).thenReturn(Mono.empty());

            StepVerifier.create(jobService.getById(99))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.JOB_NOT_FOUND)
                    .verify();
        }
    }

    // ─── activate ────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("activate()")
    class Activate {

        @Test
        @DisplayName("should activate job by setting isActive=true")
        void activate_success() {
            Job job = Job.builder()
                    .id(1)
                    .organizationId(1)
                    .title("Software Engineer")
                    .isActive(false)
                    .build();

            Job activated = Job.builder()
                    .id(1)
                    .organizationId(1)
                    .title("Software Engineer")
                    .isActive(true)
                    .build();

            when(jobRepository.findById(1)).thenReturn(Mono.just(job), Mono.just(activated));
            when(jobRepository.activateJob(1)).thenReturn(Mono.just(1));
            when(cacheUtils.clear(anyString())).thenReturn(Mono.empty());

            StepVerifier.create(jobService.activate(1)
                            .contextWrite(adminContext()))
                    .assertNext(dto -> assertThat(dto.getIsActive()).isTrue())
                    .verifyComplete();
        }

        @Test
        @DisplayName("should fail when job not found")
        void activate_notFound() {
            when(jobRepository.findById(99)).thenReturn(Mono.empty());

            StepVerifier.create(jobService.activate(99))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.JOB_NOT_FOUND)
                    .verify();
        }
    }

    // ─── deactivate ───────────────────────────────────────────────────────────

    @Nested
    @DisplayName("deactivate()")
    class Deactivate {

        @Test
        @DisplayName("should deactivate job by setting isActive=false")
        void deactivate_success() {
            Job job = Job.builder()
                    .id(1)
                    .organizationId(1)
                    .title("Software Engineer")
                    .isActive(true)
                    .build();

            Job deactivated = Job.builder()
                    .id(1)
                    .organizationId(1)
                    .title("Software Engineer")
                    .isActive(false)
                    .build();

            when(jobRepository.findById(1)).thenReturn(Mono.just(job), Mono.just(deactivated));
            when(jobRepository.deactivateJob(1)).thenReturn(Mono.just(1));
            when(cacheUtils.clear(anyString())).thenReturn(Mono.empty());

            StepVerifier.create(jobService.deactivate(1)
                            .contextWrite(adminContext()))
                    .assertNext(dto -> assertThat(dto.getIsActive()).isFalse())
                    .verifyComplete();
        }

        @Test
        @DisplayName("should fail when job not found")
        void deactivate_notFound() {
            when(jobRepository.findById(99)).thenReturn(Mono.empty());

            StepVerifier.create(jobService.deactivate(99))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.JOB_NOT_FOUND)
                    .verify();
        }
    }

    // ─── delete ──────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("delete()")
    class Delete {

        @Test
        @DisplayName("should delete job successfully")
        void delete_success() {
            Job job = Job.builder().id(1).organizationId(1).title("Engineer").build();

            when(jobRepository.findById(1)).thenReturn(Mono.just(job));
            when(jobRepository.deleteById(1)).thenReturn(Mono.empty());
            when(cacheUtils.clear(anyString())).thenReturn(Mono.empty());

            StepVerifier.create(jobService.delete(1)
                            .contextWrite(adminContext()))
                    .assertNext(result -> assertThat(result).isTrue())
                    .verifyComplete();
        }

        @Test
        @DisplayName("should fail when job not found")
        void delete_notFound() {
            when(jobRepository.findById(99)).thenReturn(Mono.empty());

            StepVerifier.create(jobService.delete(99))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.JOB_NOT_FOUND)
                    .verify();
        }
    }

    // ─── update ──────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("update()")
    class Update {

        @Test
        @DisplayName("should update job successfully")
        void update_success() {
            Job existing = Job.builder()
                    .id(1)
                    .organizationId(1)
                    .title("Old Title")
                    .companyName("Old Corp")
                    .type("full_time")
                    .build();

            Job updated = Job.builder()
                    .id(1)
                    .title("New Title")
                    .companyName("New Corp")
                    .type("part_time")
                    .build();

            UpdateJobRequest request = new UpdateJobRequest();
            request.setTitle("New Title");
            request.setType("part_time");

            when(jobRepository.findById(1)).thenReturn(Mono.just(existing));
            when(jobRepository.save(any())).thenReturn(Mono.just(updated));
            when(imageService.uploadBase64IfPresent(any())).thenReturn(Mono.empty());
            when(cacheUtils.clear(anyString())).thenReturn(Mono.empty());

            StepVerifier.create(jobService.update(1, request)
                            .contextWrite(adminContext()))
                    .assertNext(dto -> assertThat(dto.getTitle()).isEqualTo("New Title"))
                    .verifyComplete();
        }

        @Test
        @DisplayName("should fail when job not found")
        void update_notFound() {
            UpdateJobRequest request = new UpdateJobRequest();
            request.setTitle("New Title");

            when(jobRepository.findById(99)).thenReturn(Mono.empty());

            StepVerifier.create(jobService.update(99, request))
                    .expectErrorMatches(err -> err instanceof ApplicationException &&
                            ((ApplicationException) err).getErrorCode() == ErrorCode.JOB_NOT_FOUND)
                    .verify();
        }
    }

    @Nested
    @DisplayName("getActiveList()")
    class GetActiveList {

        @Test
        @SuppressWarnings("unchecked")
        @DisplayName("should apply all filters and exclude featured from the backend page")
        void filtersAndPaginates() {
            when(cacheUtils.<FeaturedPaginatedResponse<JobResponse>>getOrCompute(
                    eq("job_cache"), anyString(), any(), any()))
                    .thenAnswer(invocation -> ((Supplier<Mono<FeaturedPaginatedResponse<JobResponse>>>)
                            invocation.getArgument(3)).get());
            Job featured = Job.builder()
                    .id(8)
                    .title("Featured")
                    .description("<p>Featured <strong>description</strong></p>")
                    .build();
            Job item = Job.builder()
                    .id(6)
                    .title("Result")
                    .description("<p>" + "x".repeat(300) + "</p>")
                    .build();
            when(jobRepository.findPublicFeatured(
                    2, "engineer", "full_time,remote", "2026-07-01", "2026-08-07", "newest"))
                    .thenReturn(Mono.just(featured));
            when(jobRepository.findPublicPage(
                    2, 8, "engineer", "full_time,remote", "2026-07-01", "2026-08-07", "newest", 12, 0))
                    .thenReturn(Flux.just(item));
            when(jobRepository.countPublicPage(
                    2, 8, "engineer", "full_time,remote", "2026-07-01", "2026-08-07"))
                    .thenReturn(Mono.just(1L));

            StepVerifier.create(jobService.getActiveList(
                            0, 12, 2, " engineer ", "remote,full_time",
                            LocalDate.of(2026, 7, 1), LocalDate.of(2026, 8, 7), "newest"))
                    .assertNext(response -> {
                        assertThat(response.getFeatured().getId()).isEqualTo(8);
                        assertThat(response.getFeatured().getDescription()).isEqualTo("Featured description");
                        assertThat(response.getItems()).extracting(JobResponse::getId).containsExactly(6);
                        assertThat(response.getItems().get(0).getDescription()).hasSize(260).doesNotContain("<p>");
                        assertThat(response.getTotalItem()).isEqualTo(1);
                        assertThat(response.getTotalPage()).isEqualTo(1);
                    })
                    .verifyComplete();
        }
    }
}
