package com.service.backend.article.usecase.article;

import com.service.backend.article.domain.entity.Achievement;
import com.service.backend.article.domain.repository.IAchievementRepository;
import com.service.backend.article.presentation.dto.request.CreateAchievementRequest;
import com.service.backend.article.presentation.dto.request.UpdateAchievementRequest;
import com.service.backend.article.presentation.dto.response.AchievementResponse;
import com.service.backend.article.presentation.dto.response.PaginatedResponse;
import com.service.backend.shared.constants.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class AchievementService {

    private final IAchievementRepository achievementRepository;

    private static final Integer MOCK_MEMBER_ID = 1;

    public Mono<AchievementResponse> create(CreateAchievementRequest request) {
        Achievement achievement = Achievement.builder()
                .memberId(MOCK_MEMBER_ID)
                .title(request.getTitle())
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .awardedDate(request.getAwardedDate())
                .status(request.getStatus())
                .build();

        return achievementRepository.create(achievement)
                .map(AchievementResponse::from);
    }

    public Mono<AchievementResponse> update(Integer id, UpdateAchievementRequest request) {
        return achievementRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.ACHIEVEMENT_NOT_FOUND, "Achievement not found with id: " + id)))
                .flatMap(existing -> {
                    Achievement updated = Achievement.builder()
                            .title(request.getTitle())
                            .description(request.getDescription())
                            .imageUrl(request.getImageUrl())
                            .awardedDate(request.getAwardedDate())
                            .status(request.getStatus())
                            .build();
                    return achievementRepository.update(id, updated);
                })
                .map(AchievementResponse::from);
    }

    public Mono<Boolean> delete(Integer id) {
        return achievementRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.ACHIEVEMENT_NOT_FOUND, "Achievement not found with id: " + id)))
                .flatMap(existing -> achievementRepository.delete(id));
    }

    public Mono<AchievementResponse> getById(Integer id) {
        return achievementRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.ACHIEVEMENT_NOT_FOUND, "Achievement not found with id: " + id)))
                .map(AchievementResponse::from);
    }

    public Mono<PaginatedResponse<AchievementResponse>> getAll(int page, int limit) {
        return achievementRepository.findAll(page, limit)
                .map(paginatedResponse -> PaginatedResponse.of(
                        paginatedResponse.getItems().stream().map(AchievementResponse::from).toList(),
                        paginatedResponse.getTotal(),
                        paginatedResponse.getPage(),
                        paginatedResponse.getLimit()
                ));
    }

    public Mono<PaginatedResponse<AchievementResponse>> getByMemberId(Integer memberId, int page, int limit) {
        return achievementRepository.findByMemberId(memberId, page, limit)
                .map(paginatedResponse -> PaginatedResponse.of(
                        paginatedResponse.getItems().stream().map(AchievementResponse::from).toList(),
                        paginatedResponse.getTotal(),
                        paginatedResponse.getPage(),
                        paginatedResponse.getLimit()
                ));
    }

    public Mono<PaginatedResponse<AchievementResponse>> getMyAchievements(int page, int limit) {
        return achievementRepository.findByMemberId(MOCK_MEMBER_ID, page, limit)
                .map(paginatedResponse -> PaginatedResponse.of(
                        paginatedResponse.getItems().stream().map(AchievementResponse::from).toList(),
                        paginatedResponse.getTotal(),
                        paginatedResponse.getPage(),
                        paginatedResponse.getLimit()
                ));
    }

    public Mono<PaginatedResponse<AchievementResponse>> getByStatus(String status, int page, int limit) {
        return achievementRepository.findByStatus(status, page, limit)
                .map(paginatedResponse -> PaginatedResponse.of(
                        paginatedResponse.getItems().stream().map(AchievementResponse::from).toList(),
                        paginatedResponse.getTotal(),
                        paginatedResponse.getPage(),
                        paginatedResponse.getLimit()
                ));
    }

    public Mono<PaginatedResponse<AchievementResponse>> search(String keyword, int page, int limit) {
        return achievementRepository.search(keyword, page, limit)
                .map(paginatedResponse -> PaginatedResponse.of(
                        paginatedResponse.getItems().stream().map(AchievementResponse::from).toList(),
                        paginatedResponse.getTotal(),
                        paginatedResponse.getPage(),
                        paginatedResponse.getLimit()
                ));
    }
}
