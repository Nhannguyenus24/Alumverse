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
import com.service.backend.shared.utils.CacheNames;
import com.service.backend.shared.utils.CacheUtils;
import com.service.backend.shared.utils.SecurityUtils;
import com.service.backend.user.service.NotificationService;
import com.service.backend.shared.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.function.BiConsumer;
import java.util.function.Function;

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
            return paginateWithSubmitter(
                    newsRepository.findByOrganizationIdWithPagination(organizationId, limit, offset).map(NewsResponse::from),
                    newsRepository.countByOrganizationId(organizationId), page, limit,
                    NewsResponse::getAuthorMemberId, NewsResponse::setSubmitterName, NewsResponse::setSubmitterRole, NewsResponse::setUserSubmitted
            ).doOnSuccess(r -> log.info("getAllNews (org={}) result: {}", organizationId, JsonUtils.toJson(r)));
        }
        if (keyword != null && !keyword.trim().isEmpty()) {
            String kw = keyword.trim();
            return paginateWithSubmitter(
                    newsRepository.searchAllByTitleWithPagination(kw, limit, offset).map(NewsResponse::from),
                    newsRepository.countAllSearchByTitle(kw), page, limit,
                    NewsResponse::getAuthorMemberId, NewsResponse::setSubmitterName, NewsResponse::setSubmitterRole, NewsResponse::setUserSubmitted
            ).doOnSuccess(r -> log.info("searchAllNews result: {}", JsonUtils.toJson(r)));
        }
        return paginateWithSubmitter(
                newsRepository.findAllWithPagination(limit, offset).map(NewsResponse::from),
                newsRepository.count(), page, limit,
                NewsResponse::getAuthorMemberId, NewsResponse::setSubmitterName, NewsResponse::setSubmitterRole, NewsResponse::setUserSubmitted
        ).doOnSuccess(r -> log.info("getAllNews result: {}", JsonUtils.toJson(r)));
    }

    public Mono<PaginatedResponse<AlumniPostResponse>> getAllAlumniPosts(Integer organizationId, String keyword, int page, int limit) {
        int offset = page * limit;
        if (organizationId != null) {
            return paginateWithSubmitter(
                    alumniPostRepository.findByOrganizationIdWithPagination(organizationId, limit, offset).map(AlumniPostResponse::from),
                    alumniPostRepository.countByOrganizationId(organizationId), page, limit,
                    AlumniPostResponse::getAuthorMemberId, AlumniPostResponse::setSubmitterName, AlumniPostResponse::setSubmitterRole, AlumniPostResponse::setUserSubmitted
            ).doOnSuccess(r -> log.info("getAllAlumniPosts (org={}) result: {}", organizationId, JsonUtils.toJson(r)));
        }
        if (keyword != null && !keyword.trim().isEmpty()) {
            String kw = keyword.trim();
            return paginateWithSubmitter(
                    alumniPostRepository.searchAllByTitleWithPagination(kw, limit, offset).map(AlumniPostResponse::from),
                    alumniPostRepository.countAllSearchByTitle(kw), page, limit,
                    AlumniPostResponse::getAuthorMemberId, AlumniPostResponse::setSubmitterName, AlumniPostResponse::setSubmitterRole, AlumniPostResponse::setUserSubmitted
            ).doOnSuccess(r -> log.info("searchAllAlumniPosts result: {}", JsonUtils.toJson(r)));
        }
        return paginateWithSubmitter(
                alumniPostRepository.findAllWithPagination(limit, offset).map(AlumniPostResponse::from),
                alumniPostRepository.count(), page, limit,
                AlumniPostResponse::getAuthorMemberId, AlumniPostResponse::setSubmitterName, AlumniPostResponse::setSubmitterRole, AlumniPostResponse::setUserSubmitted
        ).doOnSuccess(r -> log.info("getAllAlumniPosts result: {}", JsonUtils.toJson(r)));
    }

    public Mono<PaginatedResponse<AchievementResponse>> getAllAchievements(Integer organizationId, String keyword, int page, int limit) {
        int offset = page * limit;
        if (organizationId != null) {
            if (keyword != null && !keyword.trim().isEmpty()) {
                String kw = keyword.trim();
                return paginateWithSubmitter(
                        achievementRepository.searchByOrganizationAndTitle(organizationId, kw, limit, offset).map(AchievementResponse::from),
                        achievementRepository.countSearchByOrganizationAndTitle(organizationId, kw), page, limit,
                        AchievementResponse::getMemberId, AchievementResponse::setSubmitterName, AchievementResponse::setSubmitterRole, AchievementResponse::setUserSubmitted
                ).doOnSuccess(r -> log.info("searchAchievements (org={}) result: {}", organizationId, JsonUtils.toJson(r)));
            }
            return paginateWithSubmitter(
                    achievementRepository.findByOrganizationIdWithPagination(organizationId, limit, offset).map(AchievementResponse::from),
                    achievementRepository.countByOrganizationId(organizationId), page, limit,
                    AchievementResponse::getMemberId, AchievementResponse::setSubmitterName, AchievementResponse::setSubmitterRole, AchievementResponse::setUserSubmitted
            ).doOnSuccess(r -> log.info("getAllAchievements (org={}) result: {}", organizationId, JsonUtils.toJson(r)));
        }
        if (keyword != null && !keyword.trim().isEmpty()) {
            String kw = keyword.trim();
            return paginateWithSubmitter(
                    achievementRepository.searchAllByTitleWithPagination(kw, limit, offset).map(AchievementResponse::from),
                    achievementRepository.countAllSearchByTitle(kw), page, limit,
                    AchievementResponse::getMemberId, AchievementResponse::setSubmitterName, AchievementResponse::setSubmitterRole, AchievementResponse::setUserSubmitted
            ).doOnSuccess(r -> log.info("searchAllAchievements result: {}", JsonUtils.toJson(r)));
        }
        return paginateWithSubmitter(
                achievementRepository.findAllWithPagination(limit, offset).map(AchievementResponse::from),
                achievementRepository.count(), page, limit,
                AchievementResponse::getMemberId, AchievementResponse::setSubmitterName, AchievementResponse::setSubmitterRole, AchievementResponse::setUserSubmitted
        ).doOnSuccess(r -> log.info("getAllAchievements result: {}", JsonUtils.toJson(r)));
    }

    public Mono<PaginatedResponse<JobResponse>> getAllJobs(Integer organizationId, String keyword, int page, int limit) {
        int offset = page * limit;
        if (organizationId != null) {
            return paginateWithSubmitter(
                    jobRepository.findByOrganizationIdWithPagination(organizationId, limit, offset).map(JobResponse::from),
                    jobRepository.countByOrganizationId(organizationId), page, limit,
                    JobResponse::getPosterMemberId, JobResponse::setSubmitterName, JobResponse::setSubmitterRole, JobResponse::setUserSubmitted
            ).doOnSuccess(r -> log.info("getAllJobs (org={}) result: {}", organizationId, JsonUtils.toJson(r)));
        }
        if (keyword != null && !keyword.trim().isEmpty()) {
            String kw = keyword.trim();
            return paginateWithSubmitter(
                    jobRepository.searchAllByTitleWithPagination(kw, limit, offset).map(JobResponse::from),
                    jobRepository.countAllSearchByTitle(kw), page, limit,
                    JobResponse::getPosterMemberId, JobResponse::setSubmitterName, JobResponse::setSubmitterRole, JobResponse::setUserSubmitted
            ).doOnSuccess(r -> log.info("searchAllJobs result: {}", JsonUtils.toJson(r)));
        }
        return paginateWithSubmitter(
                jobRepository.findAllWithPagination(limit, offset).map(JobResponse::from),
                jobRepository.count(), page, limit,
                JobResponse::getPosterMemberId, JobResponse::setSubmitterName, JobResponse::setSubmitterRole, JobResponse::setUserSubmitted
        ).doOnSuccess(r -> log.info("getAllJobs result: {}", JsonUtils.toJson(r)));
    }

    public Mono<PaginatedResponse<LearningResourceResponse>> getAllLearningResources(Integer organizationId, String keyword, int page, int limit) {
        int offset = page * limit;
        if (organizationId != null) {
            return paginateWithSubmitter(
                    learningResourceRepository.findByOrganizationIdWithPagination(organizationId, limit, offset).map(LearningResourceResponse::from),
                    learningResourceRepository.countByOrganizationId(organizationId), page, limit,
                    LearningResourceResponse::getUploaderMemberId, LearningResourceResponse::setSubmitterName, LearningResourceResponse::setSubmitterRole, LearningResourceResponse::setUserSubmitted
            ).doOnSuccess(r -> log.info("getAllLearningResources (org={}) result: {}", organizationId, JsonUtils.toJson(r)));
        }
        if (keyword != null && !keyword.trim().isEmpty()) {
            String kw = keyword.trim();
            return paginateWithSubmitter(
                    learningResourceRepository.searchAllByTitleWithPagination(kw, limit, offset).map(LearningResourceResponse::from),
                    learningResourceRepository.countAllSearchByTitle(kw), page, limit,
                    LearningResourceResponse::getUploaderMemberId, LearningResourceResponse::setSubmitterName, LearningResourceResponse::setSubmitterRole, LearningResourceResponse::setUserSubmitted
            ).doOnSuccess(r -> log.info("searchAllLearningResources result: {}", JsonUtils.toJson(r)));
        }
        return paginateWithSubmitter(
                learningResourceRepository.findAllWithPagination(limit, offset).map(LearningResourceResponse::from),
                learningResourceRepository.count(), page, limit,
                LearningResourceResponse::getUploaderMemberId, LearningResourceResponse::setSubmitterName, LearningResourceResponse::setSubmitterRole, LearningResourceResponse::setUserSubmitted
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
                .delayUntil(updated -> cacheUtils.clear(CacheNames.ACHIEVEMENT)
                        .then(cacheUtils.clear(CacheNames.ADMIN_CONTENT_STATISTICS)))
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
                // A status change moves the resource into/out of the APPROVED lists — evict the list cache
                // (and content stats) so getAll/getByType/search reflect it immediately.
                .delayUntil(updated -> cacheUtils.clear(CacheNames.LEARNING_RESOURCE)
                        .then(cacheUtils.clear(CacheNames.ADMIN_CONTENT_STATISTICS)))
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

    /**
     * Paginate a page of responses and enrich each with its submitter's name/role in a single
     * batched user lookup (one {@code findAllById} instead of one {@code findById} per row).
     */
    private <T> Mono<PaginatedResponse<T>> paginateWithSubmitter(
            Flux<T> items,
            Mono<Long> total,
            int page,
            int limit,
            Function<T, Integer> idGetter,
            BiConsumer<T, String> nameSetter,
            BiConsumer<T, String> roleSetter,
            BiConsumer<T, Boolean> submittedSetter
    ) {
        return PaginationHelper.paginate(items, total, page, limit,
                list -> attachSubmissionMetadataBatch(list, idGetter, nameSetter, roleSetter, submittedSetter));
    }

    private <T> Mono<List<T>> attachSubmissionMetadataBatch(
            List<T> responses,
            Function<T, Integer> idGetter,
            BiConsumer<T, String> nameSetter,
            BiConsumer<T, String> roleSetter,
            BiConsumer<T, Boolean> submittedSetter
    ) {
        Set<Integer> ids = new HashSet<>();
        for (T r : responses) {
            Integer id = idGetter.apply(r);
            if (id != null) ids.add(id);
        }
        if (ids.isEmpty()) {
            responses.forEach(r -> submittedSetter.accept(r, false));
            return Mono.just(responses);
        }
        return adminUserRepository.findAllById(ids)
                .collectMap(User::getId, u -> u)
                .map(byId -> {
                    for (T r : responses) {
                        Integer id = idGetter.apply(r);
                        User user = id != null ? byId.get(id) : null;
                        if (user != null) {
                            String role = user.getRole() != null ? user.getRole().getValue() : null;
                            nameSetter.accept(r, user.getFullName() != null && !user.getFullName().isBlank()
                                    ? user.getFullName() : user.getEmail());
                            roleSetter.accept(r, role);
                            submittedSetter.accept(r, isUserSubmittedRole(role));
                        } else {
                            submittedSetter.accept(r, false);
                        }
                    }
                    return responses;
                });
    }

    private boolean isUserSubmittedRole(String role) {
        return role != null
                && !"ADMIN".equalsIgnoreCase(role)
                && !"STAFF".equalsIgnoreCase(role);
    }
}
