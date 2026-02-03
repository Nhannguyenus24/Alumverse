package com.service.backend.article.usecase.article;

import com.service.backend.article.domain.entity.Job;
import com.service.backend.article.domain.repository.IJobRepository;
import com.service.backend.article.presentation.dto.request.CreateJobRequest;
import com.service.backend.article.presentation.dto.request.UpdateJobRequest;
import com.service.backend.article.presentation.dto.response.JobResponse;
import com.service.backend.article.presentation.dto.response.PaginatedResponse;
import com.service.backend.shared.constants.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class JobService {

    private final IJobRepository jobRepository;

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
                .build();

        return jobRepository.create(job)
                .map(JobResponse::from);
    }

    public Mono<JobResponse> update(Integer id, UpdateJobRequest request) {
        return jobRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.JOB_NOT_FOUND, "Job not found with id: " + id)))
                .flatMap(existing -> {
                    Job updated = Job.builder()
                            .title(request.getTitle())
                            .description(request.getDescription())
                            .companyName(request.getCompanyName())
                            .location(request.getLocation())
                            .type(request.getType())
                            .salaryRange(request.getSalaryRange())
                            .howToApply(request.getHowToApply())
                            .deadline(request.getDeadline())
                            .isReferral(request.getIsReferral() != null ? request.getIsReferral() : false)
                            .build();
                    return jobRepository.update(id, updated);
                })
                .map(JobResponse::from);
    }

    public Mono<Boolean> delete(Integer id) {
        return jobRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.JOB_NOT_FOUND, "Job not found with id: " + id)))
                .flatMap(existing -> jobRepository.delete(id));
    }

    public Mono<JobResponse> getById(Integer id) {
        return jobRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.JOB_NOT_FOUND, "Job not found with id: " + id)))
                .map(JobResponse::from);
    }

    public Mono<PaginatedResponse<JobResponse>> getAll(int page, int limit) {
        return jobRepository.findByOrganizationId(MOCK_ORGANIZATION_ID, page, limit)
                .map(paginatedResponse -> PaginatedResponse.of(
                        paginatedResponse.getItems().stream().map(JobResponse::from).toList(),
                        paginatedResponse.getTotal(),
                        paginatedResponse.getPage(),
                        paginatedResponse.getLimit()
                ));
    }

    public Mono<PaginatedResponse<JobResponse>> getActive(int page, int limit) {
        return jobRepository.findActive(MOCK_ORGANIZATION_ID, page, limit)
                .map(paginatedResponse -> PaginatedResponse.of(
                        paginatedResponse.getItems().stream().map(JobResponse::from).toList(),
                        paginatedResponse.getTotal(),
                        paginatedResponse.getPage(),
                        paginatedResponse.getLimit()
                ));
    }

    public Mono<PaginatedResponse<JobResponse>> getOpenJobs(int page, int limit) {
        return jobRepository.findOpenJobs(MOCK_ORGANIZATION_ID, page, limit)
                .map(paginatedResponse -> PaginatedResponse.of(
                        paginatedResponse.getItems().stream().map(JobResponse::from).toList(),
                        paginatedResponse.getTotal(),
                        paginatedResponse.getPage(),
                        paginatedResponse.getLimit()
                ));
    }

    public Mono<PaginatedResponse<JobResponse>> search(String keyword, int page, int limit) {
        return jobRepository.search(MOCK_ORGANIZATION_ID, keyword, page, limit)
                .map(paginatedResponse -> PaginatedResponse.of(
                        paginatedResponse.getItems().stream().map(JobResponse::from).toList(),
                        paginatedResponse.getTotal(),
                        paginatedResponse.getPage(),
                        paginatedResponse.getLimit()
                ));
    }

    public Mono<JobResponse> activate(Integer id) {
        return jobRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.JOB_NOT_FOUND, "Job not found with id: " + id)))
                .flatMap(existing -> jobRepository.activate(id))
                .map(JobResponse::from);
    }

    public Mono<JobResponse> deactivate(Integer id) {
        return jobRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.JOB_NOT_FOUND, "Job not found with id: " + id)))
                .flatMap(existing -> jobRepository.deactivate(id))
                .map(JobResponse::from);
    }
}
