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
import com.service.backend.user.service.NotificationService;
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
    private final NotificationService notificationService;

    public Mono<JobResponse> create(CreateJobRequest request) {
        return Mono.zip(SecurityUtils.getCurrentUserId(), SecurityUtils.getCurrentUserRole())
                .flatMap(ctx -> {
                    Long userId = ctx.getT1();
                    String role = ctx.getT2();
                    boolean publishImmediately = "ADMIN".equalsIgnoreCase(role) || "STAFF".equalsIgnoreCase(role);
                    return SecurityUtils.resolveContentOrganizationId(request.getOrganizationId())
                            .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.BAD_REQUEST, "Organization ID is required to create job")))
                            .flatMap(orgId -> SecurityUtils.assertCanSubmitContributorContent(orgId)
                                    .then(Mono.defer(() -> {
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
                            .url(request.getUrl())
                            .deadline(request.getDeadline())
                            .isReferral(request.getIsReferral() != null ? request.getIsReferral() : false)
                            .isActive(publishImmediately)
                            .createdAt(LocalDateTime.now())
                            .build();

                    return jobRepository.save(job)
                            .delayUntil(res -> cacheUtils.clear("admin_content_statistics"))
                            .doOnNext(saved -> {
                                if (!publishImmediately) {
                                    notificationService.createNotificationAsync(
                                            saved.getPosterMemberId(),
                                            "Cơ hội việc làm đã được gửi",
                                            "Bài viết \"" + saved.getTitle() + "\" đã được gửi. Admin sẽ xem xét trước khi hiển thị công khai.",
                                            "/development/jobs"
                                    );
                                }
                            })
                            .map(JobResponse::from);
                            })));
                });
    }

    public Mono<JobResponse> update(Integer id, UpdateJobRequest request) {
        return jobRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.JOB_NOT_FOUND, "Job not found with id: " + id)))
                .flatMap(existing -> SecurityUtils.assertCanManageContentOrganization(existing.getOrganizationId())
                        .then(Mono.defer(() -> {
                    existing.setTitle(request.getTitle());
                    existing.setDescription(request.getDescription());
                    existing.setCompanyName(request.getCompanyName());
                    existing.setLocation(request.getLocation());
                    existing.setType(JobType.valueOf(request.getType().toUpperCase().replace("-", "_")));
                    existing.setSalaryRange(request.getSalaryRange());
                    existing.setHowToApply(request.getHowToApply());
                    existing.setUrl(request.getUrl());
                    existing.setDeadline(request.getDeadline());
                    existing.setIsReferral(request.getIsReferral() != null ? request.getIsReferral() : false);
                    return jobRepository.save(existing);
                })))
                .delayUntil(res -> cacheUtils.clear("admin_content_statistics"))
                .map(JobResponse::from);
    }

    public Mono<Boolean> delete(Integer id) {
        return jobRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.JOB_NOT_FOUND, "Job not found with id: " + id)))
                .flatMap(existing -> SecurityUtils.assertCanManageContentOrganization(existing.getOrganizationId())
                        .then(jobRepository.deleteById(id))
                        .then(cacheUtils.clear("admin_content_statistics"))
                        .thenReturn(true));
    }

    public Mono<JobResponse> getById(Integer id) {
        return jobRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.JOB_NOT_FOUND, "Job not found with id: " + id)))
                .map(JobResponse::from);
    }

    public Mono<JobResponse> getPublicById(Integer id, Integer organizationId) {
        return SecurityUtils.resolvePublicOrganizationId(organizationId)
                .flatMap(orgId -> jobRepository.findById(id)
                        .filter(job -> orgId.equals(job.getOrganizationId())
                                && Boolean.TRUE.equals(job.getIsActive())))
                .switchIfEmpty(Mono.error(new ApplicationException(
                        ErrorCode.JOB_NOT_FOUND, "Active job not found")))
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

    public Mono<PaginatedResponse<JobResponse>> getActive(int page, int limit, Integer organizationId) {
        int offset = page * limit;
        return SecurityUtils.resolvePublicOrganizationId(organizationId)
                .flatMap(orgId -> PaginationHelper.paginate(
                        jobRepository.findActiveByOrganizationId(orgId, limit, offset).map(JobResponse::from),
                        jobRepository.countActiveByOrganizationId(orgId),
                        page, limit))
                .switchIfEmpty(Mono.just(PaginatedResponse.of(java.util.List.of(), 0, page, limit)));
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
        return search(keyword, page, limit, null);
    }

    public Mono<PaginatedResponse<JobResponse>> search(String keyword, int page, int limit, Integer organizationId) {
        int offset = page * limit;
        return SecurityUtils.resolvePublicOrganizationId(organizationId)
                .flatMap(orgId -> PaginationHelper.paginate(
                        jobRepository.searchJobs(orgId, keyword, limit, offset).map(JobResponse::from),
                        jobRepository.countSearchJobs(orgId, keyword),
                        page, limit))
                .switchIfEmpty(Mono.just(PaginatedResponse.of(java.util.List.of(), 0, page, limit)));
    }

    public Mono<JobResponse> activate(Integer id) {
        return jobRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.JOB_NOT_FOUND, "Job not found with id: " + id)))
                .flatMap(existing -> SecurityUtils.assertCanManageContentOrganization(existing.getOrganizationId())
                        .then(jobRepository.activateJob(id))
                        .then(jobRepository.findById(id)))
                .delayUntil(res -> cacheUtils.clear("admin_content_statistics"))
                .doOnNext(updated -> notificationService.createNotificationAsync(
                        updated.getPosterMemberId(),
                        "Cơ hội việc làm đã được duyệt",
                        "Bài viết \"" + updated.getTitle() + "\" đã được duyệt và hiển thị công khai.",
                        "/article/job/" + updated.getId()
                ))
                .map(JobResponse::from);
    }

    public Mono<JobResponse> deactivate(Integer id) {
        return jobRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.JOB_NOT_FOUND, "Job not found with id: " + id)))
                .flatMap(existing -> SecurityUtils.assertCanManageContentOrganization(existing.getOrganizationId())
                        .then(jobRepository.deactivateJob(id))
                        .then(jobRepository.findById(id)))
                .delayUntil(res -> cacheUtils.clear("admin_content_statistics"))
                .doOnNext(updated -> notificationService.createNotificationAsync(
                        updated.getPosterMemberId(),
                        "Cơ hội việc làm bị gỡ đăng",
                        "Bài viết \"" + updated.getTitle() + "\" đã bị gỡ khỏi trang công khai.",
                        "/development/jobs"
                ))
                .map(JobResponse::from);
    }
}
