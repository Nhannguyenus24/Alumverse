package com.service.backend.article.service;

import com.service.backend.article.dao.JobR2dbcRepository;
import com.service.backend.shared.entity.Job;
import com.service.backend.article.dto.CreateJobRequest;
import com.service.backend.article.dto.UpdateJobRequest;
import com.service.backend.article.dto.JobResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.utils.PaginationHelper;
import com.service.backend.shared.utils.SecurityUtils;
import com.service.backend.shared.utils.CacheUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.service.backend.shared.enums.JobType;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class JobService {

    private final JobR2dbcRepository jobRepository;
    private final CacheUtils cacheUtils;

    public Mono<JobResponse> create(CreateJobRequest request) {
        return Mono.zip(SecurityUtils.getCurrentUserId(), SecurityUtils.getCurrentOrganizationId())
                .flatMap(ctx -> {
                    Long userId = ctx.getT1();
                    Integer orgId = ctx.getT2();
                    Job job = Job.builder()
                            .organizationId(orgId)
                            .posterMemberId(userId.intValue())
                            .title(request.getTitle())
                            .description(request.getDescription())
                            .companyName(request.getCompanyName())
                            .location(request.getLocation())
                            .type(JobType.valueOf(request.getType().toUpperCase().replace("-", "_")))
                            .salaryRange(request.getSalaryRange())
                            .howToApply(request.getHowToApply())
                            .deadline(request.getDeadline())
                            .isReferral(request.getIsReferral() != null ? request.getIsReferral() : false)
                            .isActive(true)
                            .createdAt(LocalDateTime.now())
                            .build();

                    return jobRepository.save(job)
                            .delayUntil(res -> cacheUtils.clear("admin_content_statistics"))
                            .map(JobResponse::from);
                });
    }

    public Mono<JobResponse> update(Integer id, UpdateJobRequest request) {
        return jobRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.JOB_NOT_FOUND, "Job not found with id: " + id)))
                .flatMap(existing -> {
                    existing.setTitle(request.getTitle());
                    existing.setDescription(request.getDescription());
                    existing.setCompanyName(request.getCompanyName());
                    existing.setLocation(request.getLocation());
                    existing.setType(JobType.valueOf(request.getType().toUpperCase().replace("-", "_")));
                    existing.setSalaryRange(request.getSalaryRange());
                    existing.setHowToApply(request.getHowToApply());
                    existing.setDeadline(request.getDeadline());
                    existing.setIsReferral(request.getIsReferral() != null ? request.getIsReferral() : false);
                    if (existing.getCreatedAt() == null) existing.setCreatedAt(LocalDateTime.now());
                    return jobRepository.save(existing);
                })
                .delayUntil(res -> cacheUtils.clear("admin_content_statistics"))
                .map(JobResponse::from);
    }

    public Mono<Boolean> delete(Integer id) {
        return jobRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.JOB_NOT_FOUND, "Job not found with id: " + id)))
                .flatMap(existing -> jobRepository.deleteById(id)
                        .delayUntil(res -> cacheUtils.clear("admin_content_statistics"))
                        .thenReturn(true));
    }

    public Mono<JobResponse> getById(Integer id) {
        return jobRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.JOB_NOT_FOUND, "Job not found with id: " + id)))
                .map(JobResponse::from);
    }

    public Mono<PaginatedResponse<JobResponse>> getAll(int page, int limit) {
        int offset = page * limit;
        return SecurityUtils.getCurrentOrganizationId()
                .flatMap(orgId -> PaginationHelper.paginate(
                        jobRepository.findByOrganizationIdWithPagination(orgId, limit, offset).map(JobResponse::from),
                        jobRepository.countByOrganizationId(orgId),
                        page, limit))
                .switchIfEmpty(Mono.defer(() -> PaginationHelper.paginate(
                        jobRepository.findAllWithPagination(limit, offset).map(JobResponse::from),
                        jobRepository.count(),
                        page, limit)));
    }

    public Mono<PaginatedResponse<JobResponse>> getActive(int page, int limit) {
        int offset = page * limit;
        return SecurityUtils.getCurrentOrganizationId()
                .flatMap(orgId -> PaginationHelper.paginate(
                        jobRepository.findActiveByOrganizationId(orgId, limit, offset).map(JobResponse::from),
                        jobRepository.countActiveByOrganizationId(orgId),
                        page, limit))
                .switchIfEmpty(Mono.defer(() -> PaginationHelper.paginate(
                        jobRepository.findAllActiveWithPagination(limit, offset).map(JobResponse::from),
                        jobRepository.countAllActive(),
                        page, limit)));
    }

    public Mono<PaginatedResponse<JobResponse>> getOpenJobs(int page, int limit) {
        int offset = page * limit;
        LocalDate today = LocalDate.now();
        return SecurityUtils.getCurrentOrganizationId()
                .flatMap(orgId -> PaginationHelper.paginate(
                        jobRepository.findOpenJobs(orgId, today, limit, offset).map(JobResponse::from),
                        jobRepository.countOpenJobs(orgId, today),
                        page, limit))
                .switchIfEmpty(Mono.defer(() -> PaginationHelper.paginate(
                        jobRepository.findAllOpenJobsWithPagination(today, limit, offset).map(JobResponse::from),
                        jobRepository.countAllOpenJobs(today),
                        page, limit)));
    }

    public Mono<PaginatedResponse<JobResponse>> search(String keyword, int page, int limit) {
        int offset = page * limit;
        return SecurityUtils.getCurrentOrganizationId()
                .flatMap(orgId -> PaginationHelper.paginate(
                        jobRepository.searchJobs(orgId, keyword, limit, offset).map(JobResponse::from),
                        jobRepository.countSearchJobs(orgId, keyword),
                        page, limit))
                .switchIfEmpty(Mono.defer(() -> PaginationHelper.paginate(
                        jobRepository.searchAllByTitleWithPagination(keyword, limit, offset).map(JobResponse::from),
                        jobRepository.countAllSearchByTitle(keyword),
                        page, limit)));
    }

    public Mono<JobResponse> activate(Integer id) {
        return jobRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.JOB_NOT_FOUND, "Job not found with id: " + id)))
                .flatMap(existing -> jobRepository.activateJob(id).then(jobRepository.findById(id)))
                .delayUntil(res -> cacheUtils.clear("admin_content_statistics"))
                .map(JobResponse::from);
    }

    public Mono<JobResponse> deactivate(Integer id) {
        return jobRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.JOB_NOT_FOUND, "Job not found with id: " + id)))
                .flatMap(existing -> jobRepository.deactivateJob(id).then(jobRepository.findById(id)))
                .delayUntil(res -> cacheUtils.clear("admin_content_statistics"))
                .map(JobResponse::from);
    }
}
