package com.service.backend.admin.service;

import com.service.backend.article.dao.*;
import com.service.backend.article.dto.*;
import com.service.backend.fundraising.dao.FundR2dbcRepository;
import com.service.backend.fundraising.dto.FundListItemResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.utils.JsonUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.List;

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

    public Mono<PaginatedResponse<NewsResponse>> getAllNews(String keyword, int page, int limit) {
        return getAllNews(null, keyword, page, limit);
    }

    public Mono<PaginatedResponse<NewsResponse>> getAllNews(Integer organizationId, String keyword, int page, int limit) {
        int offset = page * limit;
        if (organizationId != null) {
            return newsRepository.findByOrganizationIdWithPagination(organizationId, limit, offset)
                    .map(NewsResponse::from)
                    .collectList()
                    .zipWith(newsRepository.countByOrganizationId(organizationId))
                    .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit))
                    .doOnSuccess(r -> log.info("getAllNews (org={}) result: {}", organizationId, JsonUtils.toJson(r)));
        }
        if (keyword != null && !keyword.trim().isEmpty()) {
            String kw = keyword.trim();
            return newsRepository.searchAllByTitleWithPagination(kw, limit, offset)
                    .map(NewsResponse::from)
                    .collectList()
                    .zipWith(newsRepository.countAllSearchByTitle(kw))
                    .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit))
                    .doOnSuccess(r -> log.info("searchAllNews result: {}", JsonUtils.toJson(r)));
        }
        return newsRepository.findAllWithPagination(limit, offset)
                .map(NewsResponse::from)
                .collectList()
                .zipWith(newsRepository.count())
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit))
                .doOnSuccess(r -> log.info("getAllNews result: {}", JsonUtils.toJson(r)));
    }

    public Mono<PaginatedResponse<AlumniPostResponse>> getAllAlumniPosts(String keyword, int page, int limit) {
        return getAllAlumniPosts(null, keyword, page, limit);
    }

    public Mono<PaginatedResponse<AlumniPostResponse>> getAllAlumniPosts(Integer organizationId, String keyword, int page, int limit) {
        int offset = page * limit;
        if (organizationId != null) {
            return alumniPostRepository.findByOrganizationIdWithPagination(organizationId, limit, offset)
                    .map(AlumniPostResponse::from)
                    .collectList()
                    .zipWith(alumniPostRepository.countByOrganizationId(organizationId))
                    .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit))
                    .doOnSuccess(r -> log.info("getAllAlumniPosts (org={}) result: {}", organizationId, JsonUtils.toJson(r)));
        }
        if (keyword != null && !keyword.trim().isEmpty()) {
            String kw = keyword.trim();
            return alumniPostRepository.searchAllByTitleWithPagination(kw, limit, offset)
                    .map(AlumniPostResponse::from)
                    .collectList()
                    .zipWith(alumniPostRepository.countAllSearchByTitle(kw))
                    .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit))
                    .doOnSuccess(r -> log.info("searchAllAlumniPosts result: {}", JsonUtils.toJson(r)));
        }
        return alumniPostRepository.findAllWithPagination(limit, offset)
                .map(AlumniPostResponse::from)
                .collectList()
                .zipWith(alumniPostRepository.count())
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit))
                .doOnSuccess(r -> log.info("getAllAlumniPosts result: {}", JsonUtils.toJson(r)));
    }

    public Mono<PaginatedResponse<AchievementResponse>> getAllAchievements(String keyword, int page, int limit) {
        return getAllAchievements(null, keyword, page, limit);
    }

    public Mono<PaginatedResponse<AchievementResponse>> getAllAchievements(Integer organizationId, String keyword, int page, int limit) {
        int offset = page * limit;
        if (organizationId != null) {
            if (keyword != null && !keyword.trim().isEmpty()) {
                String kw = keyword.trim();
                return achievementRepository.searchByOrganizationAndTitle(organizationId, kw, limit, offset)
                        .map(AchievementResponse::from)
                        .collectList()
                        .zipWith(achievementRepository.countSearchByOrganizationAndTitle(organizationId, kw))
                        .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit))
                        .doOnSuccess(r -> log.info("searchAchievements (org={}) result: {}", organizationId, JsonUtils.toJson(r)));
            }
            return achievementRepository.findByOrganizationIdWithPagination(organizationId, limit, offset)
                    .map(AchievementResponse::from)
                    .collectList()
                    .zipWith(achievementRepository.countByOrganizationId(organizationId))
                    .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit))
                    .doOnSuccess(r -> log.info("getAllAchievements (org={}) result: {}", organizationId, JsonUtils.toJson(r)));
        }
        if (keyword != null && !keyword.trim().isEmpty()) {
            String kw = keyword.trim();
            return achievementRepository.searchAllByTitleWithPagination(kw, limit, offset)
                    .map(AchievementResponse::from)
                    .collectList()
                    .zipWith(achievementRepository.countAllSearchByTitle(kw))
                    .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit))
                    .doOnSuccess(r -> log.info("searchAllAchievements result: {}", JsonUtils.toJson(r)));
        }
        return achievementRepository.findAllWithPagination(limit, offset)
                .map(AchievementResponse::from)
                .collectList()
                .zipWith(achievementRepository.count())
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit))
                .doOnSuccess(r -> log.info("getAllAchievements result: {}", JsonUtils.toJson(r)));
    }

    public Mono<PaginatedResponse<JobResponse>> getAllJobs(String keyword, int page, int limit) {
        return getAllJobs(null, keyword, page, limit);
    }

    public Mono<PaginatedResponse<JobResponse>> getAllJobs(Integer organizationId, String keyword, int page, int limit) {
        int offset = page * limit;
        if (organizationId != null) {
            return jobRepository.findByOrganizationIdWithPagination(organizationId, limit, offset)
                    .map(JobResponse::from)
                    .collectList()
                    .zipWith(jobRepository.countByOrganizationId(organizationId))
                    .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit))
                    .doOnSuccess(r -> log.info("getAllJobs (org={}) result: {}", organizationId, JsonUtils.toJson(r)));
        }
        if (keyword != null && !keyword.trim().isEmpty()) {
            String kw = keyword.trim();
            return jobRepository.searchAllByTitleWithPagination(kw, limit, offset)
                    .map(JobResponse::from)
                    .collectList()
                    .zipWith(jobRepository.countAllSearchByTitle(kw))
                    .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit))
                    .doOnSuccess(r -> log.info("searchAllJobs result: {}", JsonUtils.toJson(r)));
        }
        return jobRepository.findAllWithPagination(limit, offset)
                .map(JobResponse::from)
                .collectList()
                .zipWith(jobRepository.count())
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit))
                .doOnSuccess(r -> log.info("getAllJobs result: {}", JsonUtils.toJson(r)));
    }

    public Mono<PaginatedResponse<LearningResourceResponse>> getAllLearningResources(String keyword, int page, int limit) {
        return getAllLearningResources(null, keyword, page, limit);
    }

    public Mono<PaginatedResponse<LearningResourceResponse>> getAllLearningResources(Integer organizationId, String keyword, int page, int limit) {
        int offset = page * limit;
        if (organizationId != null) {
            return learningResourceRepository.findByOrganizationIdWithPagination(organizationId, limit, offset)
                    .map(LearningResourceResponse::from)
                    .collectList()
                    .zipWith(learningResourceRepository.countByOrganizationId(organizationId))
                    .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit))
                    .doOnSuccess(r -> log.info("getAllLearningResources (org={}) result: {}", organizationId, JsonUtils.toJson(r)));
        }
        if (keyword != null && !keyword.trim().isEmpty()) {
            String kw = keyword.trim();
            return learningResourceRepository.searchAllByTitleWithPagination(kw, limit, offset)
                    .map(LearningResourceResponse::from)
                    .collectList()
                    .zipWith(learningResourceRepository.countAllSearchByTitle(kw))
                    .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit))
                    .doOnSuccess(r -> log.info("searchAllLearningResources result: {}", JsonUtils.toJson(r)));
        }
        return learningResourceRepository.findAllWithPagination(limit, offset)
                .map(LearningResourceResponse::from)
                .collectList()
                .zipWith(learningResourceRepository.count())
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit))
                .doOnSuccess(r -> log.info("getAllLearningResources result: {}", JsonUtils.toJson(r)));
    }

    public Mono<PaginatedResponse<FundListItemResponse>> getAllFunds(String keyword, int page, int limit) {
        return getAllFunds(null, keyword, page, limit);
    }

    public Mono<PaginatedResponse<FundListItemResponse>> getAllFunds(Integer organizationId, String keyword, int page, int limit) {
        int offset = page * limit;
        String kw = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        return fundRepository.findFiltered(organizationId, null, kw, null, null, null, null, limit, offset)
                .map(FundListItemResponse::from)
                .collectList()
                .zipWith(fundRepository.countFiltered(organizationId, null, kw, null, null, null, null))
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit))
                .doOnSuccess(r -> log.info("getAllFunds result (org={}, keyword={}): {}", organizationId, kw, JsonUtils.toJson(r)));
    }
}
