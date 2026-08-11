package com.service.backend.article.service;

import com.service.backend.article.dao.JobR2dbcRepository;
import com.service.backend.shared.entity.Job;
import com.service.backend.article.dto.CreateJobRequest;
import com.service.backend.article.dto.UpdateJobRequest;
import com.service.backend.article.dto.JobResponse;
import com.service.backend.article.validation.ArticleTopicCatalog;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.dto.FeaturedPaginatedResponse;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.service.ImageService;
import com.service.backend.shared.utils.PaginationHelper;
import com.service.backend.shared.utils.SecurityUtils;
import com.service.backend.shared.utils.CacheNames;
import com.service.backend.shared.utils.CacheUtils;
import com.service.backend.shared.utils.HtmlPreviewUtils;
import com.service.backend.user.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class JobService {

    private static final Duration LIST_TTL = Duration.ofMinutes(5);
    private static final int DESCRIPTION_PREVIEW_LENGTH = 260;

    private final JobR2dbcRepository jobRepository;
    private final ImageService imageService;
    private final CacheUtils cacheUtils;
    private final NotificationService notificationService;

    /**
     * Clears the job list cache and the admin content-statistics cache. Called by every write that
     * changes what the job lists (getAll/getActive/getOpenJobs/search) or the content counts return:
     * create/update/delete/activate/deactivate.
     */
    private Mono<Void> evictJobCaches() {
        return cacheUtils.clear(CacheNames.JOB)
                .then(cacheUtils.clear(CacheNames.ADMIN_CONTENT_STATISTICS));
    }

    public Mono<JobResponse> create(CreateJobRequest request) {
        String type = ArticleTopicCatalog.requireValid(ArticleTopicCatalog.Channel.JOB, request.getType());
        return Mono.zip(SecurityUtils.getCurrentUserId(), SecurityUtils.getCurrentUserRole())
                .flatMap(ctx -> {
                    Long userId = ctx.getT1();
                    String role = ctx.getT2();
                    boolean publishImmediately = "ADMIN".equalsIgnoreCase(role) || "STAFF".equalsIgnoreCase(role);
                    return SecurityUtils.resolveContentOrganizationId(request.getOrganizationId())
                            .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.BAD_REQUEST, "Organization ID is required to create job")))
                            .flatMap(orgId -> SecurityUtils.assertCanSubmitContributorContent(orgId)
                                    .then(imageService.uploadBase64IfPresent(request.getThumbnailBase64()).defaultIfEmpty(""))
                                    .flatMap(thumbnailUrl -> {
                    Job job = Job.builder()
                            .organizationId(orgId)
                            .posterMemberId(userId.intValue())
                            .title(request.getTitle())
                            .description(request.getDescription())
                            .companyName(request.getCompanyName())
                            .location(request.getLocation())
                            .type(type)
                            .salaryRange(request.getSalaryRange())
                            .howToApply(request.getHowToApply())
                            .url(request.getUrl())
                            .thumbnailUrl(thumbnailUrl.isEmpty() ? null : thumbnailUrl)
                            .deadline(request.getDeadline())
                            .isReferral(request.getIsReferral() != null ? request.getIsReferral() : false)
                            .isActive(publishImmediately)
                            .createdAt(LocalDateTime.now())
                            .build();

                    return jobRepository.save(job)
                            .delayUntil(res -> evictJobCaches())
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
                            }));
                });
    }

    public Mono<JobResponse> update(Integer id, UpdateJobRequest request) {
        String type = request.getType() != null
                ? ArticleTopicCatalog.requireValid(ArticleTopicCatalog.Channel.JOB, request.getType())
                : null;
        return jobRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.JOB_NOT_FOUND, "Job not found with id: " + id)))
                .flatMap(existing -> SecurityUtils.assertCanManageContentOrganization(existing.getOrganizationId())
                        .then(imageService.uploadBase64IfPresent(request.getThumbnailBase64()).defaultIfEmpty("")
                                .flatMap(thumbnailUrl -> {
                    existing.setTitle(request.getTitle());
                    existing.setDescription(request.getDescription());
                    existing.setCompanyName(request.getCompanyName());
                    existing.setLocation(request.getLocation());
                    if (request.getType() != null) existing.setType(type);
                    existing.setSalaryRange(request.getSalaryRange());
                    existing.setHowToApply(request.getHowToApply());
                    existing.setUrl(request.getUrl());
                    existing.setThumbnailUrl(thumbnailUrl.isEmpty() ? existing.getThumbnailUrl() : thumbnailUrl);
                    existing.setDeadline(request.getDeadline());
                    existing.setIsReferral(request.getIsReferral() != null ? request.getIsReferral() : false);
                    return jobRepository.save(existing);
                })))
                .delayUntil(res -> evictJobCaches())
                .map(JobResponse::from);
    }

    public Mono<Boolean> delete(Integer id) {
        return jobRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.JOB_NOT_FOUND, "Job not found with id: " + id)))
                .flatMap(existing -> SecurityUtils.assertCanManageContentOrganization(existing.getOrganizationId())
                        .then(jobRepository.deleteById(id))
                        .then(evictJobCaches())
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
                        .filter(job -> orgId.equals(job.getOrganizationId()))
                        .flatMap(job -> Boolean.TRUE.equals(job.getIsActive())
                                ? Mono.just(job)
                                : SecurityUtils.canManageContentOrganization(job.getOrganizationId())
                                        .filter(Boolean::booleanValue)
                                        .map(ignored -> job)))
                .switchIfEmpty(Mono.error(new ApplicationException(
                        ErrorCode.JOB_NOT_FOUND, "Active job not found")))
                .map(JobResponse::from);
    }

    public Mono<PaginatedResponse<JobResponse>> getAll(int page, int limit) {
        int offset = page * limit;
        return SecurityUtils.getCurrentOrganizationId()
                .flatMap(orgId -> cacheUtils.getOrCompute(CacheNames.JOB,
                        "all_org_" + orgId + "_p" + page + "_l" + limit, LIST_TTL, () -> PaginationHelper.paginate(
                                jobRepository.findByOrganizationIdWithPagination(orgId, limit, offset).map(JobResponse::from),
                                jobRepository.countByOrganizationId(orgId),
                                page, limit)))
                .switchIfEmpty(Mono.defer(() -> cacheUtils.getOrCompute(CacheNames.JOB,
                        "all_global_p" + page + "_l" + limit, LIST_TTL, () -> PaginationHelper.paginate(
                                jobRepository.findAllWithPagination(limit, offset).map(JobResponse::from),
                                jobRepository.count(),
                                page, limit))));
    }

    public Mono<PaginatedResponse<JobResponse>> getActive(int page, int limit, Integer organizationId) {
        int offset = page * limit;
        return SecurityUtils.resolvePublicOrganizationId(organizationId)
                .flatMap(orgId -> cacheUtils.getOrCompute(CacheNames.JOB,
                        "active_org_" + orgId + "_p" + page + "_l" + limit, LIST_TTL, () -> PaginationHelper.paginate(
                                jobRepository.findActiveByOrganizationId(orgId, limit, offset).map(JobResponse::from),
                                jobRepository.countActiveByOrganizationId(orgId),
                                page, limit)))
                .switchIfEmpty(Mono.just(PaginatedResponse.of(java.util.List.of(), 0, page, limit)));
    }

    public Mono<FeaturedPaginatedResponse<JobResponse>> getActiveList(
            int page,
            int limit,
            Integer organizationId,
            String keyword,
            String topics,
            LocalDate fromDate,
            LocalDate toDate,
            String direction) {
        String normalizedKeyword = keyword == null ? "" : keyword.trim();
        String normalizedTopics = normalizeTopics(topics);
        String normalizedDirection = "oldest".equalsIgnoreCase(direction) ? "oldest" : "newest";
        String from = fromDate == null ? "" : fromDate.toString();
        String to = toDate == null ? "" : toDate.toString();
        int offset = page * limit;

        return SecurityUtils.resolvePublicOrganizationId(organizationId)
                .flatMap(orgId -> {
                    String cacheKey = String.join("|",
                            "active-v2",
                            "org=" + orgId,
                            "page=" + page,
                            "limit=" + limit,
                            "keyword=" + normalizedKeyword.toLowerCase(Locale.ROOT),
                            "topics=" + normalizedTopics,
                            "from=" + from,
                            "to=" + to,
                            "direction=" + normalizedDirection);

                    return cacheUtils.getOrCompute(CacheNames.JOB, cacheKey, LIST_TTL,
                            () -> jobRepository.findPublicFeatured(
                                            orgId, normalizedKeyword, normalizedTopics, from, to, normalizedDirection)
                                    .map(JobResponse::from)
                                    .map(this::withDescriptionPreview)
                                    .map(Optional::of)
                                    .defaultIfEmpty(Optional.empty())
                                    .flatMap(featuredOptional -> {
                                        Integer featuredId = featuredOptional.map(JobResponse::getId).orElse(null);
                                        Mono<List<JobResponse>> items = jobRepository.findPublicPage(
                                                        orgId, featuredId, normalizedKeyword, normalizedTopics,
                                                        from, to, normalizedDirection, limit, offset)
                                                .map(JobResponse::from)
                                                .map(this::withDescriptionPreview)
                                                .collectList();
                                        Mono<Long> total = jobRepository.countPublicPage(
                                                orgId, featuredId, normalizedKeyword, normalizedTopics, from, to);

                                        return Mono.zip(items, total)
                                                .map(result -> FeaturedPaginatedResponse.of(
                                                        featuredOptional.orElse(null),
                                                        result.getT1(), result.getT2(), page, limit));
                                    }));
                })
                .switchIfEmpty(Mono.just(FeaturedPaginatedResponse.of(
                        null, List.of(), 0, page, limit)));
    }

    /**
     * Job descriptions are rich HTML. List cards only need a bounded plain-text excerpt; detail
     * endpoints intentionally retain the full description.
     */
    private JobResponse withDescriptionPreview(JobResponse item) {
        item.setDescription(HtmlPreviewUtils.toPlainTextPreview(
                item.getDescription(), DESCRIPTION_PREVIEW_LENGTH));
        return item;
    }

    public Mono<PaginatedResponse<JobResponse>> getOpenJobs(int page, int limit) {
        int offset = page * limit;
        LocalDate today = LocalDate.now();
        return SecurityUtils.getCurrentOrganizationId()
                .flatMap(orgId -> cacheUtils.getOrCompute(CacheNames.JOB,
                        "open_org_" + orgId + "_" + today + "_p" + page + "_l" + limit, LIST_TTL, () -> PaginationHelper.paginate(
                                jobRepository.findOpenJobs(orgId, today, limit, offset).map(JobResponse::from),
                                jobRepository.countOpenJobs(orgId, today),
                                page, limit)))
                .switchIfEmpty(Mono.defer(() -> cacheUtils.getOrCompute(CacheNames.JOB,
                        "open_global_" + today + "_p" + page + "_l" + limit, LIST_TTL, () -> PaginationHelper.paginate(
                                jobRepository.findAllOpenJobsWithPagination(today, limit, offset).map(JobResponse::from),
                                jobRepository.countAllOpenJobs(today),
                                page, limit))));
    }

    public Mono<PaginatedResponse<JobResponse>> search(String keyword, int page, int limit) {
        return search(keyword, page, limit, null);
    }

    public Mono<PaginatedResponse<JobResponse>> search(String keyword, int page, int limit, Integer organizationId) {
        int offset = page * limit;
        return SecurityUtils.resolvePublicOrganizationId(organizationId)
                .flatMap(orgId -> cacheUtils.getOrCompute(CacheNames.JOB,
                        "search_org_" + orgId + "_kw_" + keyword + "_p" + page + "_l" + limit, LIST_TTL, () -> PaginationHelper.paginate(
                                jobRepository.searchJobs(orgId, keyword, limit, offset).map(JobResponse::from),
                                jobRepository.countSearchJobs(orgId, keyword),
                                page, limit)))
                .switchIfEmpty(Mono.just(PaginatedResponse.of(java.util.List.of(), 0, page, limit)));
    }

    public Mono<JobResponse> activate(Integer id) {
        return jobRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.JOB_NOT_FOUND, "Job not found with id: " + id)))
                .flatMap(existing -> SecurityUtils.assertCanManageContentOrganization(existing.getOrganizationId())
                        .then(jobRepository.activateJob(id))
                        .then(jobRepository.findById(id)))
                .delayUntil(res -> evictJobCaches())
                .doOnNext(updated -> notificationService.createNotificationAsync(
                        updated.getPosterMemberId(),
                        "Cơ hội việc làm đã được duyệt",
                        "Bài viết \"" + updated.getTitle() + "\" đã được duyệt và hiển thị công khai.",
                        "/article/job/" + updated.getId()
                ))
                .map(JobResponse::from);
    }

    private String normalizeTopics(String topics) {
        if (topics == null || topics.isBlank()) {
            return "";
        }
        return Arrays.stream(topics.split(","))
                .map(ArticleTopicCatalog::normalize)
                .filter(topic -> topic != null && !topic.isBlank())
                .distinct()
                .sorted()
                .reduce((left, right) -> left + "," + right)
                .orElse("");
    }

    public Mono<JobResponse> deactivate(Integer id) {
        return jobRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.JOB_NOT_FOUND, "Job not found with id: " + id)))
                .flatMap(existing -> SecurityUtils.assertCanManageContentOrganization(existing.getOrganizationId())
                        .then(jobRepository.deactivateJob(id))
                        .then(jobRepository.findById(id)))
                .delayUntil(res -> evictJobCaches())
                .doOnNext(updated -> notificationService.createNotificationAsync(
                        updated.getPosterMemberId(),
                        "Cơ hội việc làm bị gỡ đăng",
                        "Bài viết \"" + updated.getTitle() + "\" đã bị gỡ khỏi trang công khai.",
                        "/development/jobs"
                ))
                .map(JobResponse::from);
    }

}
