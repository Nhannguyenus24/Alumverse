package com.service.backend.article.service;

import com.service.backend.article.dao.JobR2dbcRepository;
import com.service.backend.article.dto.JobResponse;
import com.service.backend.article.dto.UpdateJobRequest;
import com.service.backend.shared.entity.Job;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.enums.JobType;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.utils.CacheUtils;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("JobService Unit Tests")
class JobServiceTest {

    @Mock private JobR2dbcRepository jobRepository;
    @Mock private CacheUtils cacheUtils;

    @InjectMocks
    private JobService jobService;

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
                    .type(JobType.FULL_TIME)
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
                    .title("Software Engineer")
                    .isActive(false)
                    .build();

            Job activated = Job.builder()
                    .id(1)
                    .title("Software Engineer")
                    .isActive(true)
                    .build();

            when(jobRepository.findById(1)).thenReturn(Mono.just(job));
            when(jobRepository.activateJob(1)).thenReturn(Mono.just(1));
            when(jobRepository.findById(1)).thenReturn(Mono.just(activated));
            when(cacheUtils.clear(anyString())).thenReturn(Mono.empty());

            StepVerifier.create(jobService.activate(1))
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
                    .title("Software Engineer")
                    .isActive(true)
                    .build();

            Job deactivated = Job.builder()
                    .id(1)
                    .title("Software Engineer")
                    .isActive(false)
                    .build();

            when(jobRepository.findById(1)).thenReturn(Mono.just(job));
            when(jobRepository.deactivateJob(1)).thenReturn(Mono.just(1));
            when(jobRepository.findById(1)).thenReturn(Mono.just(deactivated));
            when(cacheUtils.clear(anyString())).thenReturn(Mono.empty());

            StepVerifier.create(jobService.deactivate(1))
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
            Job job = Job.builder().id(1).title("Engineer").build();

            when(jobRepository.findById(1)).thenReturn(Mono.just(job));
            when(jobRepository.deleteById(1)).thenReturn(Mono.empty());
            when(cacheUtils.clear(anyString())).thenReturn(Mono.empty());

            StepVerifier.create(jobService.delete(1))
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
                    .title("Old Title")
                    .companyName("Old Corp")
                    .type(JobType.FULL_TIME)
                    .build();

            Job updated = Job.builder()
                    .id(1)
                    .title("New Title")
                    .companyName("New Corp")
                    .type(JobType.PART_TIME)
                    .build();

            UpdateJobRequest request = new UpdateJobRequest();
            request.setTitle("New Title");
            request.setType(JobType.PART_TIME.getValue());

            when(jobRepository.findById(1)).thenReturn(Mono.just(existing));
            when(jobRepository.save(any())).thenReturn(Mono.just(updated));
            when(cacheUtils.clear(anyString())).thenReturn(Mono.empty());

            StepVerifier.create(jobService.update(1, request))
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
}
