package com.service.backend.admin.service;

import com.service.backend.admin.dto.ContentStatisticsDTO;
import com.service.backend.article.dao.AchievementR2dbcRepository;
import com.service.backend.article.dao.AlumniPostR2dbcRepository;
import com.service.backend.article.dao.JobR2dbcRepository;
import com.service.backend.article.dao.LearningResourceR2dbcRepository;
import com.service.backend.article.dao.NewsR2dbcRepository;
import com.service.backend.shared.utils.CacheUtils;
import lombok.RequiredArgsConstructor;
import java.time.Duration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AdminContentService {

    private static final Logger log = LoggerFactory.getLogger(AdminContentService.class);

    private final NewsR2dbcRepository newsRepository;
    private final AlumniPostR2dbcRepository alumniPostRepository;
    private final JobR2dbcRepository jobRepository;
    private final LearningResourceR2dbcRepository learningResourceRepository;
    private final AchievementR2dbcRepository achievementRepository;
    private final CacheUtils cacheUtils;

    public Mono<ContentStatisticsDTO> getStatistics() {
        return cacheUtils.getOrCompute("admin_content_statistics", "all", Duration.ofDays(1), () -> {
            LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);
        LocalDateTime monthAgo = LocalDateTime.now().minusDays(30);

        Mono<Long> totalNewsMono = newsRepository.count();
        Mono<Long> totalAlumniPostsMono = alumniPostRepository.count();
        Mono<Long> totalJobsMono = jobRepository.count();
        Mono<Long> activeJobsMono = jobRepository.countAllActive();
        Mono<Long> totalLearningResourcesMono = learningResourceRepository.count();
        Mono<Long> totalAchievementsMono = achievementRepository.countAll();

        Mono<Long> newThisWeekMono = Mono.zip(
                newsRepository.countSince(weekAgo),
                alumniPostRepository.countSince(weekAgo),
                jobRepository.countSince(weekAgo),
                learningResourceRepository.countSince(weekAgo)
        ).map(t -> t.getT1() + t.getT2() + t.getT3() + t.getT4());

        Mono<Long> newThisMonthMono = Mono.zip(
                newsRepository.countSince(monthAgo),
                alumniPostRepository.countSince(monthAgo),
                jobRepository.countSince(monthAgo),
                learningResourceRepository.countSince(monthAgo)
        ).map(t -> t.getT1() + t.getT2() + t.getT3() + t.getT4());

        return Mono.zip(
                totalNewsMono, totalAlumniPostsMono, totalJobsMono,
                activeJobsMono, totalLearningResourcesMono, totalAchievementsMono,
                newThisWeekMono, newThisMonthMono
        ).map(t -> ContentStatisticsDTO.builder()
                .totalNews(t.getT1())
                .totalAlumniPosts(t.getT2())
                .totalJobs(t.getT3())
                .activeJobs(t.getT4())
                .totalLearningResources(t.getT5())
                .totalAchievements(t.getT6())
                .newContentThisWeek(t.getT7())
                .newContentThisMonth(t.getT8())
                .build())
                .doOnSuccess(r -> log.info("getContentStatistics completed"))
                .doOnError(e -> log.error("Error fetching content statistics", e));
        });
    }
}
