package com.service.backend.admin.service;

import com.service.backend.article.dao.*;
import com.service.backend.article.dto.*;
import com.service.backend.fundraising.dao.FundR2dbcRepository;
import com.service.backend.fundraising.dto.FundListItemResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.List;

@Service
public class AdminArticleService {

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

    public Mono<PaginatedResponse<NewsResponse>> getAllNews(int page, int limit) {
        int offset = page * limit;
        return newsRepository.findAllWithPagination(limit, offset)
                .map(NewsResponse::from)
                .collectList()
                .zipWith(newsRepository.count())
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit));
    }

    public Mono<PaginatedResponse<AlumniPostResponse>> getAllAlumniPosts(int page, int limit) {
        int offset = page * limit;
        return alumniPostRepository.findAllWithPagination(limit, offset)
                .map(AlumniPostResponse::from)
                .collectList()
                .zipWith(alumniPostRepository.count())
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit));
    }

    public Mono<PaginatedResponse<AchievementResponse>> getAllAchievements(int page, int limit) {
        int offset = page * limit;
        return achievementRepository.findAllWithPagination(limit, offset)
                .map(AchievementResponse::from)
                .collectList()
                .zipWith(achievementRepository.count())
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit));
    }

    public Mono<PaginatedResponse<JobResponse>> getAllJobs(int page, int limit) {
        int offset = page * limit;
        return jobRepository.findAllWithPagination(limit, offset)
                .map(JobResponse::from)
                .collectList()
                .zipWith(jobRepository.count())
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit));
    }

    public Mono<PaginatedResponse<LearningResourceResponse>> getAllLearningResources(int page, int limit) {
        int offset = page * limit;
        return learningResourceRepository.findAllWithPagination(limit, offset)
                .map(LearningResourceResponse::from)
                .collectList()
                .zipWith(learningResourceRepository.count())
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit));
    }

    public Mono<PaginatedResponse<FundListItemResponse>> getAllFunds(int page, int limit) {
        int offset = page * limit;
        return fundRepository.findAllWithPagination(limit, offset)
                .map(FundListItemResponse::from)
                .collectList()
                .zipWith(fundRepository.countAll())
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit));
    }
}
