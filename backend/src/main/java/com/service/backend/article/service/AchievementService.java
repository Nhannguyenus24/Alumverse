package com.service.backend.article.usecase;

import com.service.backend.article.dao.AchievementR2dbcRepository;
import com.service.backend.shared.entity.Achievement;
import com.service.backend.article.dto.CreateAchievementRequest;
import com.service.backend.article.dto.UpdateAchievementRequest;
import com.service.backend.article.dto.AchievementResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.service.ImageService;
import com.service.backend.shared.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class AchievementService {

    private final AchievementR2dbcRepository achievementRepository;
    private final ImageService imageService;

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

                            return achievementRepository.save(achievement).map(AchievementResponse::from);
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
                .map(AchievementResponse::from);
    }

    public Mono<Boolean> delete(Integer id) {
        return achievementRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.ACHIEVEMENT_NOT_FOUND, "Achievement not found with id: " + id)))
                .flatMap(existing -> achievementRepository.deleteById(id).thenReturn(true));
    }

    public Mono<AchievementResponse> getById(Integer id) {
        return achievementRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.ACHIEVEMENT_NOT_FOUND, "Achievement not found with id: " + id)))
                .map(AchievementResponse::from);
    }

    public Mono<PaginatedResponse<AchievementResponse>> getAll(int page, int limit) {
        int offset = page * limit;
        return achievementRepository.findAllWithPagination(limit, offset)
                .collectList()
                .zipWith(achievementRepository.countAll())
                .map(tuple -> PaginatedResponse.of(
                        tuple.getT1().stream().map(AchievementResponse::from).toList(),
                        tuple.getT2(), page, limit
                ));
    }

    public Mono<PaginatedResponse<AchievementResponse>> getByMemberId(Integer memberId, int page, int limit) {
        int offset = page * limit;
        return achievementRepository.findByMemberId(memberId, limit, offset)
                .collectList()
                .zipWith(achievementRepository.countByMemberId(memberId))
                .map(tuple -> PaginatedResponse.of(
                        tuple.getT1().stream().map(AchievementResponse::from).toList(),
                        tuple.getT2(), page, limit
                ));
    }

    public Mono<PaginatedResponse<AchievementResponse>> getMyAchievements(int page, int limit) {
        return SecurityUtils.getCurrentUserId()
                .flatMap(userId -> getByMemberId(userId.intValue(), page, limit));
    }

    public Mono<PaginatedResponse<AchievementResponse>> getByStatus(String status, int page, int limit) {
        int offset = page * limit;
        return achievementRepository.findByStatus(status, limit, offset)
                .collectList()
                .zipWith(achievementRepository.countByStatus(status))
                .map(tuple -> PaginatedResponse.of(
                        tuple.getT1().stream().map(AchievementResponse::from).toList(),
                        tuple.getT2(), page, limit
                ));
    }

    public Mono<PaginatedResponse<AchievementResponse>> search(String keyword, int page, int limit) {
        int offset = page * limit;
        return achievementRepository.searchAchievements(keyword, limit, offset)
                .collectList()
                .zipWith(achievementRepository.countSearchAchievements(keyword))
                .map(tuple -> PaginatedResponse.of(
                        tuple.getT1().stream().map(AchievementResponse::from).toList(),
                        tuple.getT2(), page, limit
                ));
    }
}
