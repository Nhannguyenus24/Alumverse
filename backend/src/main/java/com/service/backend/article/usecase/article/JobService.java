package com.service.backend.article.usecase.article;

import com.service.backend.article.dao.JobR2dbcRepository;
import com.service.backend.article.domain.entity.Job;
import com.service.backend.article.presentation.dto.request.CreateJobRequest;
import com.service.backend.article.presentation.dto.request.UpdateJobRequest;
import com.service.backend.article.presentation.dto.response.JobResponse;
import com.service.backend.article.presentation.dto.response.PaginatedResponse;
import com.service.backend.shared.constants.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class JobService {

    private final JobR2dbcRepository jobRepository;

    private static final Integer MOCK_ORGANIZATION_ID = 1;
    private static final Integer MOCK_POSTER_MEMBER_ID = 1;

    public Mono<JobResponse> create(CreateJobRequest request) {
        Job job = Job.builder()
                .organizationId(MOCK_ORGANIZATION_ID)
                .posterMemberId(MOCK_POSTER_MEMBER_ID)
                .title(request.getTitle())
                .description(request.getDescription())
                .companyName(request.getCompanyName())
                .location(request.getLocation())
                .type(request.getType())
                .salaryRange(request.getSalaryRange())
                .howToApply(request.getHowToApply())
                .deadline(request.getDeadline())
                .isReferral(request.getIsReferral() != null ? request.getIsReferral() : false)
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .build();

        return jobRepository.save(job)
                .map(JobResponse::from);
    }

    public Mono<JobResponse> update(Integer id, UpdateJobRequest request) {
        return jobRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.JOB_NOT_FOUND, "Job not found with id: " + id)))
                .flatMap(existing -> {
                    existing.setTitle(request.getTitle());
                    existing.setDescription(request.getDescription());
                    existing.setCompanyName(request.getCompanyName());
                    existing.setLocation(request.getLocation());
                    existing.setType(request.getType());
                    existing.setSalaryRange(request.getSalaryRange());
                    existing.setHowToApply(request.getHowToApply());
                    existing.setDeadline(request.getDeadline());
                    existing.setIsReferral(request.getIsReferral() != null ? request.getIsReferral() : false);
                    return jobRepository.save(existing);
                })
                .map(JobResponse::from);
    }

    public Mono<Boolean> delete(Integer id) {
        return jobRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.JOB_NOT_FOUND, "Job not found with id: " + id)))
                .flatMap(existing -> jobRepository.deleteById(id).thenReturn(true));
    }

    public Mono<JobResponse> getById(Integer id) {
        return jobRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.JOB_NOT_FOUND, "Job not found with id: " + id)))
                .map(JobResponse::from);
    }

    public Mono<PaginatedResponse<JobResponse>> getAll(int page, int limit) {
        int offset = page * limit;
        return jobRepository.findByOrganizationIdWithPagination(MOCK_ORGANIZATION_ID, limit, offset)
                .collectList()
                .zipWith(jobRepository.countByOrganizationId(MOCK_ORGANIZATION_ID))
                .map(tuple -> PaginatedResponse.of(
                        tuple.getT1().stream().map(JobResponse::from).toList(),
                        tuple.getT2(), page, limit
                ));
    }

    public Mono<PaginatedResponse<JobResponse>> getActive(int page, int limit) {
        int offset = page * limit;
        return jobRepository.findActiveByOrganizationId(MOCK_ORGANIZATION_ID, limit, offset)
                .collectList()
                .zipWith(jobRepository.countActiveByOrganizationId(MOCK_ORGANIZATION_ID))
                .map(tuple -> PaginatedResponse.of(
                        tuple.getT1().stream().map(JobResponse::from).toList(),
                        tuple.getT2(), page, limit
                ));
    }

    public Mono<PaginatedResponse<JobResponse>> getOpenJobs(int page, int limit) {
        int offset = page * limit;
        LocalDate today = LocalDate.now();
        return jobRepository.findOpenJobs(MOCK_ORGANIZATION_ID, today, limit, offset)
                .collectList()
                .zipWith(jobRepository.countOpenJobs(MOCK_ORGANIZATION_ID, today))
                .map(tuple -> PaginatedResponse.of(
                        tuple.getT1().stream().map(JobResponse::from).toList(),
                        tuple.getT2(), page, limit
                ));
    }

    public Mono<PaginatedResponse<JobResponse>> search(String keyword, int page, int limit) {
        int offset = page * limit;
        return jobRepository.searchJobs(MOCK_ORGANIZATION_ID, keyword, limit, offset)
                .collectList()
                .zipWith(jobRepository.countSearchJobs(MOCK_ORGANIZATION_ID, keyword))
                .map(tuple -> PaginatedResponse.of(
                        tuple.getT1().stream().map(JobResponse::from).toList(),
                        tuple.getT2(), page, limit
                ));
    }

    public Mono<JobResponse> activate(Integer id) {
        return jobRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.JOB_NOT_FOUND, "Job not found with id: " + id)))
                .flatMap(existing -> jobRepository.activateJob(id).then(jobRepository.findById(id)))
                .map(JobResponse::from);
    }

    public Mono<JobResponse> deactivate(Integer id) {
        return jobRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.JOB_NOT_FOUND, "Job not found with id: " + id)))
                .flatMap(existing -> jobRepository.deactivateJob(id).then(jobRepository.findById(id)))
                .map(JobResponse::from);
    }
}
