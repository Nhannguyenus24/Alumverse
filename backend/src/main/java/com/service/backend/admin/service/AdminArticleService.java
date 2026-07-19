package com.service.backend.admin.service;

import com.service.backend.admin.dao.AdminUserRepository;
import com.service.backend.article.dao.*;
import com.service.backend.article.dto.*;
import com.service.backend.fundraising.dao.FundR2dbcRepository;
import com.service.backend.fundraising.dto.FundListItemResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.enums.Status;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.utils.JsonUtils;
import com.service.backend.shared.utils.PaginationHelper;
import com.service.backend.shared.utils.CacheUtils;
import com.service.backend.shared.utils.SecurityUtils;
import com.service.backend.user.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.function.BiConsumer;

@Service
public class AdminArticleService {

    private static final Logger log = LoggerFactory.getLogger(AdminArticleService.class);

    private final NewsR2dbcRepository newsRepository;
    private final AlumniPostR2dbcRepository alumniPostRepository;
    private final AchievementR2dbcRepository achievementRepository;
    private final JobR2dbcRepository jobRepository;
    private final LearningResourceR2dbcRepository learningResourceRepository;
    private final FundR2dbcRepository fundRepository;
    private final NotificationService notificationService;
    private final AdminUserRepository adminUserRepository;
    private final CacheUtils cacheUtils;

    public AdminArticleService(NewsR2dbcRepository newsRepository,
                               AlumniPostR2dbcRepository alumniPostRepository,
                               AchievementR2dbcRepository achievementRepository,
                               JobR2dbcRepository jobRepository,
                               LearningResourceR2dbcRepository learningResourceRepository,
                               FundR2dbcRepository fundRepository,
                               NotificationService notificationService,
                               AdminUserRepository adminUserRepository,
                               CacheUtils cacheUtils) {
        this.newsRepository = newsRepository;
        this.alumniPostRepository = alumniPostRepository;
        this.achievementRepository = achievementRepository;
        this.jobRepository = jobRepository;
        this.learningResourceRepository = learningResourceRepository;
        this.fundRepository = fundRepository;
        this.notificationService = notificationService;
        this.adminUserRepository = adminUserRepository;
        this.cacheUtils = cacheUtils;
    }

    public Mono<PaginatedResponse<NewsResponse>> getAllNews(Integer organizationId, String keyword, int page, int limit) {
        int offset = page * limit;
        if (organizationId != null) {
            return PaginationHelper.paginate(
                    newsRepository.findByOrganizationIdWithPagination(organizationId, limit, offset)
                            .map(NewsResponse::from)
                            .flatMap(response -> attachSubmissionMetadata(response, response.getAuthorMemberId(), NewsResponse::setSubmitterName, NewsResponse::setSubmitterRole, NewsResponse::setUserSubmitted)),
                    newsRepository.countByOrganizationId(organizationId),
                    page, limit
            ).doOnSuccess(r -> log.info("getAllNews (org={}) result: {}", organizationId, JsonUtils.toJson(r)));
        }
        if (keyword != null && !keyword.trim().isEmpty()) {
            String kw = keyword.trim();
            return PaginationHelper.paginate(
                    newsRepository.searchAllByTitleWithPagination(kw, limit, offset)
                            .map(NewsResponse::from)
                            .flatMap(response -> attachSubmissionMetadata(response, response.getAuthorMemberId(), NewsResponse::setSubmitterName, NewsResponse::setSubmitterRole, NewsResponse::setUserSubmitted)),
                    newsRepository.countAllSearchByTitle(kw),
                    page, limit
            ).doOnSuccess(r -> log.info("searchAllNews result: {}", JsonUtils.toJson(r)));
        }
        return PaginationHelper.paginate(
                newsRepository.findAllWithPagination(limit, offset)
                        .map(NewsResponse::from)
                        .flatMap(response -> attachSubmissionMetadata(response, response.getAuthorMemberId(), NewsResponse::setSubmitterName, NewsResponse::setSubmitterRole, NewsResponse::setUserSubmitted)),
                newsRepository.count(),
                page, limit
        ).doOnSuccess(r -> log.info("getAllNews result: {}", JsonUtils.toJson(r)));
    }

    public Mono<PaginatedResponse<AlumniPostResponse>> getAllAlumniPosts(Integer organizationId, String keyword, int page, int limit) {
        int offset = page * limit;
        if (organizationId != null) {
            return PaginationHelper.paginate(
                    alumniPostRepository.findByOrganizationIdWithPagination(organizationId, limit, offset)
                            .map(AlumniPostResponse::from)
                            .flatMap(response -> attachSubmissionMetadata(response, response.getAuthorMemberId(), AlumniPostResponse::setSubmitterName, AlumniPostResponse::setSubmitterRole, AlumniPostResponse::setUserSubmitted)),
                    alumniPostRepository.countByOrganizationId(organizationId),
                    page, limit
            ).doOnSuccess(r -> log.info("getAllAlumniPosts (org={}) result: {}", organizationId, JsonUtils.toJson(r)));
        }
        if (keyword != null && !keyword.trim().isEmpty()) {
            String kw = keyword.trim();
            return PaginationHelper.paginate(
                    alumniPostRepository.searchAllByTitleWithPagination(kw, limit, offset)
                            .map(AlumniPostResponse::from)
                            .flatMap(response -> attachSubmissionMetadata(response, response.getAuthorMemberId(), AlumniPostResponse::setSubmitterName, AlumniPostResponse::setSubmitterRole, AlumniPostResponse::setUserSubmitted)),
                    alumniPostRepository.countAllSearchByTitle(kw),
                    page, limit
            ).doOnSuccess(r -> log.info("searchAllAlumniPosts result: {}", JsonUtils.toJson(r)));
        }
        return PaginationHelper.paginate(
                alumniPostRepository.findAllWithPagination(limit, offset)
                        .map(AlumniPostResponse::from)
                        .flatMap(response -> attachSubmissionMetadata(response, response.getAuthorMemberId(), AlumniPostResponse::setSubmitterName, AlumniPostResponse::setSubmitterRole, AlumniPostResponse::setUserSubmitted)),
                alumniPostRepository.count(),
                page, limit
        ).doOnSuccess(r -> log.info("getAllAlumniPosts result: {}", JsonUtils.toJson(r)));
    }

    public Mono<PaginatedResponse<AchievementResponse>> getAllAchievements(Integer organizationId, String keyword, int page, int limit) {
        int offset = page * limit;
        if (organizationId != null) {
            if (keyword != null && !keyword.trim().isEmpty()) {
                String kw = keyword.trim();
                return PaginationHelper.paginate(
                        achievementRepository.searchByOrganizationAndTitle(organizationId, kw, limit, offset)
                                .map(AchievementResponse::from)
                                .flatMap(response -> attachSubmissionMetadata(response, response.getMemberId(), AchievementResponse::setSubmitterName, AchievementResponse::setSubmitterRole, AchievementResponse::setUserSubmitted)),
                        achievementRepository.countSearchByOrganizationAndTitle(organizationId, kw),
                        page, limit
                ).doOnSuccess(r -> log.info("searchAchievements (org={}) result: {}", organizationId, JsonUtils.toJson(r)));
            }
            return PaginationHelper.paginate(
                    achievementRepository.findByOrganizationIdWithPagination(organizationId, limit, offset)
                            .map(AchievementResponse::from)
                            .flatMap(response -> attachSubmissionMetadata(response, response.getMemberId(), AchievementResponse::setSubmitterName, AchievementResponse::setSubmitterRole, AchievementResponse::setUserSubmitted)),
                    achievementRepository.countByOrganizationId(organizationId),
                    page, limit
            ).doOnSuccess(r -> log.info("getAllAchievements (org={}) result: {}", organizationId, JsonUtils.toJson(r)));
        }
        if (keyword != null && !keyword.trim().isEmpty()) {
            String kw = keyword.trim();
            return PaginationHelper.paginate(
                    achievementRepository.searchAllByTitleWithPagination(kw, limit, offset)
                            .map(AchievementResponse::from)
                            .flatMap(response -> attachSubmissionMetadata(response, response.getMemberId(), AchievementResponse::setSubmitterName, AchievementResponse::setSubmitterRole, AchievementResponse::setUserSubmitted)),
                    achievementRepository.countAllSearchByTitle(kw),
                    page, limit
            ).doOnSuccess(r -> log.info("searchAllAchievements result: {}", JsonUtils.toJson(r)));
        }
        return PaginationHelper.paginate(
                achievementRepository.findAllWithPagination(limit, offset)
                        .map(AchievementResponse::from)
                        .flatMap(response -> attachSubmissionMetadata(response, response.getMemberId(), AchievementResponse::setSubmitterName, AchievementResponse::setSubmitterRole, AchievementResponse::setUserSubmitted)),
                achievementRepository.count(),
                page, limit
        ).doOnSuccess(r -> log.info("getAllAchievements result: {}", JsonUtils.toJson(r)));
    }

    public Mono<PaginatedResponse<JobResponse>> getAllJobs(Integer organizationId, String keyword, int page, int limit) {
        int offset = page * limit;
        if (organizationId != null) {
            return PaginationHelper.paginate(
                    jobRepository.findByOrganizationIdWithPagination(organizationId, limit, offset)
                            .map(JobResponse::from)
                            .flatMap(response -> attachSubmissionMetadata(response, response.getPosterMemberId(), JobResponse::setSubmitterName, JobResponse::setSubmitterRole, JobResponse::setUserSubmitted)),
                    jobRepository.countByOrganizationId(organizationId),
                    page, limit
            ).doOnSuccess(r -> log.info("getAllJobs (org={}) result: {}", organizationId, JsonUtils.toJson(r)));
        }
        if (keyword != null && !keyword.trim().isEmpty()) {
            String kw = keyword.trim();
            return PaginationHelper.paginate(
                    jobRepository.searchAllByTitleWithPagination(kw, limit, offset)
                            .map(JobResponse::from)
                            .flatMap(response -> attachSubmissionMetadata(response, response.getPosterMemberId(), JobResponse::setSubmitterName, JobResponse::setSubmitterRole, JobResponse::setUserSubmitted)),
                    jobRepository.countAllSearchByTitle(kw),
                    page, limit
            ).doOnSuccess(r -> log.info("searchAllJobs result: {}", JsonUtils.toJson(r)));
        }
        return PaginationHelper.paginate(
                jobRepository.findAllWithPagination(limit, offset)
                        .map(JobResponse::from)
                        .flatMap(response -> attachSubmissionMetadata(response, response.getPosterMemberId(), JobResponse::setSubmitterName, JobResponse::setSubmitterRole, JobResponse::setUserSubmitted)),
                jobRepository.count(),
                page, limit
        ).doOnSuccess(r -> log.info("getAllJobs result: {}", JsonUtils.toJson(r)));
    }

    public Mono<PaginatedResponse<LearningResourceResponse>> getAllLearningResources(Integer organizationId, String keyword, int page, int limit) {
        int offset = page * limit;
        if (organizationId != null) {
            return PaginationHelper.paginate(
                    learningResourceRepository.findByOrganizationIdWithPagination(organizationId, limit, offset)
                            .map(LearningResourceResponse::from)
                            .flatMap(response -> attachSubmissionMetadata(response, response.getUploaderMemberId(), LearningResourceResponse::setSubmitterName, LearningResourceResponse::setSubmitterRole, LearningResourceResponse::setUserSubmitted)),
                    learningResourceRepository.countByOrganizationId(organizationId),
                    page, limit
            ).doOnSuccess(r -> log.info("getAllLearningResources (org={}) result: {}", organizationId, JsonUtils.toJson(r)));
        }
        if (keyword != null && !keyword.trim().isEmpty()) {
            String kw = keyword.trim();
            return PaginationHelper.paginate(
                    learningResourceRepository.searchAllByTitleWithPagination(kw, limit, offset)
                            .map(LearningResourceResponse::from)
                            .flatMap(response -> attachSubmissionMetadata(response, response.getUploaderMemberId(), LearningResourceResponse::setSubmitterName, LearningResourceResponse::setSubmitterRole, LearningResourceResponse::setUserSubmitted)),
                    learningResourceRepository.countAllSearchByTitle(kw),
                    page, limit
            ).doOnSuccess(r -> log.info("searchAllLearningResources result: {}", JsonUtils.toJson(r)));
        }
        return PaginationHelper.paginate(
                learningResourceRepository.findAllWithPagination(limit, offset)
                        .map(LearningResourceResponse::from)
                        .flatMap(response -> attachSubmissionMetadata(response, response.getUploaderMemberId(), LearningResourceResponse::setSubmitterName, LearningResourceResponse::setSubmitterRole, LearningResourceResponse::setUserSubmitted)),
                learningResourceRepository.count(),
                page, limit
        ).doOnSuccess(r -> log.info("getAllLearningResources result: {}", JsonUtils.toJson(r)));
    }

    public Mono<PaginatedResponse<FundListItemResponse>> getAllFunds(Integer organizationId, String keyword, int page, int limit) {
        int offset = page * limit;
        String kw = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        return PaginationHelper.paginate(
                fundRepository.findFiltered(organizationId, kw, null, null, null, null, limit, offset).map(FundListItemResponse::from),
                fundRepository.countFiltered(organizationId, kw, null, null, null, null),
                page, limit
        ).doOnSuccess(r -> log.info("getAllFunds result (org={}, keyword={}): {}", organizationId, kw, JsonUtils.toJson(r)));
    }

    public Mono<AchievementResponse> updateAchievementStatus(Integer id, Status status) {
        return achievementRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.ACHIEVEMENT_NOT_FOUND, "Achievement not found with id: " + id)))
                .flatMap(existing -> SecurityUtils.assertCanManageContentOrganization(existing.getOrganizationId())
                        .then(achievementRepository.updateStatus(id, status))
                        .then(achievementRepository.findById(id)))
                .delayUntil(updated -> cacheUtils.clear("achievement_cache")
                        .then(cacheUtils.clear("admin_content_statistics")))
                .doOnNext(updated -> {
                    if (Status.APPROVED.equals(status)) {
                        notificationService.createNotificationAsync(
                                updated.getMemberId(),
                                "Bài vinh danh đã được duyệt",
                                "Bài viết \"" + updated.getTitle() + "\" đã được duyệt và hiển thị công khai.",
                                "/honors/achievements"
                        );
                    } else if (Status.REJECTED.equals(status)) {
                        notificationService.createNotificationAsync(
                                updated.getMemberId(),
                                "Bài vinh danh bị từ chối",
                                "Bài viết \"" + updated.getTitle() + "\" chưa được duyệt. Vui lòng kiểm tra lại nội dung hoặc minh chứng.",
                                "/honors/achievements"
                        );
                    }
                })
                .map(AchievementResponse::from);
    }

    public Mono<LearningResourceResponse> updateLearningResourceStatus(Integer id, Status status) {
        return learningResourceRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.LEARNING_RESOURCE_NOT_FOUND, "Learning resource not found with id: " + id)))
                .flatMap(existing -> SecurityUtils.assertCanManageContentOrganization(existing.getOrganizationId())
                        .then(learningResourceRepository.updateStatus(id, status))
                        .then(learningResourceRepository.findById(id)))
                .doOnNext(updated -> {
                    if (Status.APPROVED.equals(status)) {
                        notificationService.createNotificationAsync(
                                updated.getUploaderMemberId(),
                                "Cơ hội học tập đã được duyệt",
                                "Bài viết \"" + updated.getTitle() + "\" đã được duyệt và hiển thị công khai.",
                                "/development/academics"
                        );
                    } else if (Status.REJECTED.equals(status)) {
                        notificationService.createNotificationAsync(
                                updated.getUploaderMemberId(),
                                "Cơ hội học tập bị gỡ đăng",
                                "Bài viết \"" + updated.getTitle() + "\" chưa được hiển thị công khai.",
                                "/development/academics"
                        );
                    }
                })
                .map(LearningResourceResponse::from);
    }

    private <T> Mono<T> attachSubmissionMetadata(
            T response,
            Integer submitterId,
            BiConsumer<T, String> nameSetter,
            BiConsumer<T, String> roleSetter,
            BiConsumer<T, Boolean> submittedSetter
    ) {
        if (submitterId == null) {
            submittedSetter.accept(response, false);
            return Mono.just(response);
        }

        return adminUserRepository.findById(submitterId)
                .map(user -> {
                    String role = user.getRole() != null ? user.getRole().getValue() : null;
                    nameSetter.accept(response, user.getFullName() != null && !user.getFullName().isBlank() ? user.getFullName() : user.getEmail());
                    roleSetter.accept(response, role);
                    submittedSetter.accept(response, isUserSubmittedRole(role));
                    return response;
                })
                .switchIfEmpty(Mono.fromSupplier(() -> {
                    submittedSetter.accept(response, false);
                    return response;
                }));
    }

    private boolean isUserSubmittedRole(String role) {
        return role != null
                && !"ADMIN".equalsIgnoreCase(role)
                && !"STAFF".equalsIgnoreCase(role);
    }
}
