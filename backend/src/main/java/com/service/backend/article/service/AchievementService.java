package com.service.backend.article.service;

import com.service.backend.article.dao.AchievementR2dbcRepository;
import com.service.backend.shared.entity.Achievement;
import com.service.backend.article.dto.CreateAchievementRequest;
import com.service.backend.article.dto.UpdateAchievementRequest;
import com.service.backend.article.dto.AchievementResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.enums.Status;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.service.ImageService;
import com.service.backend.shared.utils.JsonUtils;
import com.service.backend.shared.utils.PaginationHelper;
import com.service.backend.shared.utils.SecurityUtils;
import com.service.backend.shared.utils.CacheUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
@Slf4j
public class AchievementService {

    private final AchievementR2dbcRepository achievementRepository;
    private final ImageService imageService;
    private final CacheUtils cacheUtils;

    public Mono<AchievementResponse> create(CreateAchievementRequest request) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(userId -> imageService.uploadBase64IfPresent(request.getImageBase64())
                        .defaultIfEmpty(request.getImageUrl() == null ? "" : request.getImageUrl())
                        .flatMap(imageUrl -> {
                            Achievement achievement = Achievement.builder()
                                    .memberId(userId.intValue())
                                    .title(request.getTitle())
                                    .description(request.getDescription())
                                    .imageUrl(imageUrl.isEmpty() ? null : imageUrl)
                                    .awardedDate(request.getAwardedDate())
                                    .topic(request.getTopic())
                                    .status(request.getStatus())
                                    .build();

                            return achievementRepository.save(achievement)
                                    .delayUntil(res -> cacheUtils.clear("admin_content_statistics"))
                                    .map(AchievementResponse::from);
                        }));
    }

    public Mono<AchievementResponse> update(Integer id, UpdateAchievementRequest request) {
        return achievementRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.ACHIEVEMENT_NOT_FOUND, "Achievement not found with id: " + id)))
                .flatMap(existing -> imageService.uploadBase64IfPresent(request.getImageBase64())
                        .defaultIfEmpty(request.getImageUrl() == null ? "" : request.getImageUrl())
                        .flatMap(imageUrl -> {
                            existing.setTitle(request.getTitle());
                            existing.setDescription(request.getDescription());
                            existing.setImageUrl(imageUrl.isEmpty() ? existing.getImageUrl() : imageUrl);
                            existing.setAwardedDate(request.getAwardedDate());
                            existing.setStatus(request.getStatus());
                            if (request.getTopic() != null) existing.setTopic(request.getTopic());
                            return achievementRepository.save(existing);
                        }))
                .delayUntil(res -> cacheUtils.clear("admin_content_statistics"))
                .map(AchievementResponse::from);
    }

    public Mono<Boolean> delete(Integer id) {
        return achievementRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.ACHIEVEMENT_NOT_FOUND, "Achievement not found with id: " + id)))
                .flatMap(existing -> achievementRepository.deleteById(id)
                        .delayUntil(res -> cacheUtils.clear("admin_content_statistics"))
                        .thenReturn(true));
    }

    public Mono<AchievementResponse> getById(Integer id) {
        return achievementRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.ACHIEVEMENT_NOT_FOUND, "Achievement not found with id: " + id)))
                .map(AchievementResponse::from);
    }

    public Mono<PaginatedResponse<AchievementResponse>> getAll(int page, int limit) {
        int offset = page * limit;
        return PaginationHelper.paginate(
                achievementRepository.findAllWithPagination(limit, offset).map(AchievementResponse::from),
                achievementRepository.countAll(),
                page, limit
        );
    }

    public Mono<PaginatedResponse<AchievementResponse>> getByMemberId(Integer memberId, int page, int limit) {
        int offset = page * limit;
        return PaginationHelper.paginate(
                achievementRepository.findByMemberId(memberId, limit, offset).map(AchievementResponse::from),
                achievementRepository.countByMemberId(memberId),
                page, limit
        );
    }

    public Mono<PaginatedResponse<AchievementResponse>> getMyAchievements(int page, int limit) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(userId -> getByMemberId(userId.intValue(), page, limit));
    }

    public Mono<PaginatedResponse<AchievementResponse>> getByStatus(Status status, int page, int limit) {
        String cacheKey = "status_" + status + "_page_" + page + "_limit_" + limit;
        return cacheUtils.getOrCompute("achievement_cache", cacheKey, java.time.Duration.ofMinutes(5), () -> {
            int offset = page * limit;
            return PaginationHelper.paginate(
                    achievementRepository.findDetailsByStatus(status, limit, offset)
                            .doOnNext(item -> log.info("Fetched achievement with status {}: {}", status, JsonUtils.toJson(item)))
                            .map(AchievementResponse::from),
                    achievementRepository.countByStatus(status),
                    page, limit
            );
        });
    }

    public Mono<PaginatedResponse<AchievementResponse>> search(String keyword, int page, int limit) {
        int offset = page * limit;
        return PaginationHelper.paginate(
                achievementRepository.searchAchievements(keyword, limit, offset).map(AchievementResponse::from),
                achievementRepository.countSearchAchievements(keyword),
                page, limit
        );
    }
}
