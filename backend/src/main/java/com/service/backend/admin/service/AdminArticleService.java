package com.service.backend.admin.service;

import com.service.backend.article.dao.*;
import com.service.backend.article.dto.*;
import com.service.backend.fundraising.dao.FundR2dbcRepository;
import com.service.backend.fundraising.dto.FundListItemResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.utils.JsonUtils;
import com.service.backend.shared.utils.PaginationHelper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
public class AdminArticleService {

    private static final Logger log = LoggerFactory.getLogger(AdminArticleService.class);

    private final NewsR2dbcRepository newsRepository;
    private final AlumniPostR2dbcRepository alumniPostRepository;
    private final AchievementR2dbcRepository achievementRepository;
    private final JobR2dbcRepository jobRepository;
    private final LearningResourceR2dbcRepository learningResourceRepository;
    private final FundR2dbcRepository fundRepository;

    public AdminArticleService(NewsR2dbcRepository newsRepository,
                               AlumniPostR2dbcRepository alumniPostRepository,
                               AchievementR2dbcRepository achievementRepository,
                               JobR2dbcRepository jobRepository,
                               LearningResourceR2dbcRepository learningResourceRepository,
                               FundR2dbcRepository fundRepository) {
        this.newsRepository = newsRepository;
        this.alumniPostRepository = alumniPostRepository;
        this.achievementRepository = achievementRepository;
        this.jobRepository = jobRepository;
        this.learningResourceRepository = learningResourceRepository;
        this.fundRepository = fundRepository;
    }

    public Mono<PaginatedResponse<NewsResponse>> getAllNews(Integer organizationId, String keyword, int page, int limit) {
        int offset = page * limit;
        if (organizationId != null) {
            return PaginationHelper.paginate(
                    newsRepository.findByOrganizationIdWithPagination(organizationId, limit, offset).map(NewsResponse::from),
                    newsRepository.countByOrganizationId(organizationId),
                    page, limit
            ).doOnSuccess(r -> log.info("getAllNews (org={}) result: {}", organizationId, JsonUtils.toJson(r)));
        }
        if (keyword != null && !keyword.trim().isEmpty()) {
            String kw = keyword.trim();
            return PaginationHelper.paginate(
                    newsRepository.searchAllByTitleWithPagination(kw, limit, offset).map(NewsResponse::from),
                    newsRepository.countAllSearchByTitle(kw),
                    page, limit
            ).doOnSuccess(r -> log.info("searchAllNews result: {}", JsonUtils.toJson(r)));
        }
        return PaginationHelper.paginate(
                newsRepository.findAllWithPagination(limit, offset).map(NewsResponse::from),
                newsRepository.count(),
                page, limit
        ).doOnSuccess(r -> log.info("getAllNews result: {}", JsonUtils.toJson(r)));
    }

    public Mono<PaginatedResponse<AlumniPostResponse>> getAllAlumniPosts(Integer organizationId, String keyword, int page, int limit) {
        int offset = page * limit;
        if (organizationId != null) {
            return PaginationHelper.paginate(
                    alumniPostRepository.findByOrganizationIdWithPagination(organizationId, limit, offset).map(AlumniPostResponse::from),
                    alumniPostRepository.countByOrganizationId(organizationId),
                    page, limit
            ).doOnSuccess(r -> log.info("getAllAlumniPosts (org={}) result: {}", organizationId, JsonUtils.toJson(r)));
        }
        if (keyword != null && !keyword.trim().isEmpty()) {
            String kw = keyword.trim();
            return PaginationHelper.paginate(
                    alumniPostRepository.searchAllByTitleWithPagination(kw, limit, offset).map(AlumniPostResponse::from),
                    alumniPostRepository.countAllSearchByTitle(kw),
                    page, limit
            ).doOnSuccess(r -> log.info("searchAllAlumniPosts result: {}", JsonUtils.toJson(r)));
        }
        return PaginationHelper.paginate(
                alumniPostRepository.findAllWithPagination(limit, offset).map(AlumniPostResponse::from),
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
                        achievementRepository.searchByOrganizationAndTitle(organizationId, kw, limit, offset).map(AchievementResponse::from),
                        achievementRepository.countSearchByOrganizationAndTitle(organizationId, kw),
                        page, limit
                ).doOnSuccess(r -> log.info("searchAchievements (org={}) result: {}", organizationId, JsonUtils.toJson(r)));
            }
            return PaginationHelper.paginate(
                    achievementRepository.findByOrganizationIdWithPagination(organizationId, limit, offset).map(AchievementResponse::from),
                    achievementRepository.countByOrganizationId(organizationId),
                    page, limit
            ).doOnSuccess(r -> log.info("getAllAchievements (org={}) result: {}", organizationId, JsonUtils.toJson(r)));
        }
        if (keyword != null && !keyword.trim().isEmpty()) {
            String kw = keyword.trim();
            return PaginationHelper.paginate(
                    achievementRepository.searchAllByTitleWithPagination(kw, limit, offset).map(AchievementResponse::from),
                    achievementRepository.countAllSearchByTitle(kw),
                    page, limit
            ).doOnSuccess(r -> log.info("searchAllAchievements result: {}", JsonUtils.toJson(r)));
        }
        return PaginationHelper.paginate(
                achievementRepository.findAllWithPagination(limit, offset).map(AchievementResponse::from),
                achievementRepository.count(),
                page, limit
        ).doOnSuccess(r -> log.info("getAllAchievements result: {}", JsonUtils.toJson(r)));
    }

    public Mono<PaginatedResponse<JobResponse>> getAllJobs(Integer organizationId, String keyword, int page, int limit) {
        int offset = page * limit;
        if (organizationId != null) {
            return PaginationHelper.paginate(
                    jobRepository.findByOrganizationIdWithPagination(organizationId, limit, offset).map(JobResponse::from),
                    jobRepository.countByOrganizationId(organizationId),
                    page, limit
            ).doOnSuccess(r -> log.info("getAllJobs (org={}) result: {}", organizationId, JsonUtils.toJson(r)));
        }
        if (keyword != null && !keyword.trim().isEmpty()) {
            String kw = keyword.trim();
            return PaginationHelper.paginate(
                    jobRepository.searchAllByTitleWithPagination(kw, limit, offset).map(JobResponse::from),
                    jobRepository.countAllSearchByTitle(kw),
                    page, limit
            ).doOnSuccess(r -> log.info("searchAllJobs result: {}", JsonUtils.toJson(r)));
        }
        return PaginationHelper.paginate(
                jobRepository.findAllWithPagination(limit, offset).map(JobResponse::from),
                jobRepository.count(),
                page, limit
        ).doOnSuccess(r -> log.info("getAllJobs result: {}", JsonUtils.toJson(r)));
    }

    public Mono<PaginatedResponse<LearningResourceResponse>> getAllLearningResources(Integer organizationId, String keyword, int page, int limit) {
        int offset = page * limit;
        if (organizationId != null) {
            return PaginationHelper.paginate(
                    learningResourceRepository.findByOrganizationIdWithPagination(organizationId, limit, offset).map(LearningResourceResponse::from),
                    learningResourceRepository.countByOrganizationId(organizationId),
                    page, limit
            ).doOnSuccess(r -> log.info("getAllLearningResources (org={}) result: {}", organizationId, JsonUtils.toJson(r)));
        }
        if (keyword != null && !keyword.trim().isEmpty()) {
            String kw = keyword.trim();
            return PaginationHelper.paginate(
                    learningResourceRepository.searchAllByTitleWithPagination(kw, limit, offset).map(LearningResourceResponse::from),
                    learningResourceRepository.countAllSearchByTitle(kw),
                    page, limit
            ).doOnSuccess(r -> log.info("searchAllLearningResources result: {}", JsonUtils.toJson(r)));
        }
        return PaginationHelper.paginate(
                learningResourceRepository.findAllWithPagination(limit, offset).map(LearningResourceResponse::from),
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
}
