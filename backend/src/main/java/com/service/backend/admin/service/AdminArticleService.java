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
        int offset = page * limit;
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
        int offset = page * limit;
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
        int offset = page * limit;
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
        int offset = page * limit;
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
        int offset = page * limit;
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
        int offset = page * limit;
        String kw = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        return fundRepository.findFiltered(null, null, kw, null, null, null, null, limit, offset)
                .map(FundListItemResponse::from)
                .collectList()
                .zipWith(fundRepository.countFiltered(null, null, kw, null, null, null, null))
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit))
                .doOnSuccess(r -> log.info("getAllFunds result (keyword={}): {}", kw, JsonUtils.toJson(r)));
    }
}
