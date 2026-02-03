package com.service.backend.article.dao;

import com.service.backend.article.domain.entity.Achievement;
import com.service.backend.article.domain.repository.IAchievementRepository;
import com.service.backend.article.presentation.dto.response.PaginatedResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
@RequiredArgsConstructor
public class AchievementRepository implements IAchievementRepository {

    private final AchievementR2dbcRepository achievementRepo;

    @Override
    public Mono<Achievement> create(Achievement achievement) {
        return achievementRepo.save(achievement);
    }

    @Override
    public Mono<Achievement> update(Integer id, Achievement achievement) {
        return achievementRepo.findById(id)
                .flatMap(existing -> {
                    existing.setTitle(achievement.getTitle());
                    existing.setDescription(achievement.getDescription());
                    existing.setImageUrl(achievement.getImageUrl());
                    existing.setAwardedDate(achievement.getAwardedDate());
                    existing.setStatus(achievement.getStatus());
                    return achievementRepo.save(existing);
                });
    }

    @Override
    public Mono<Boolean> delete(Integer id) {
        return achievementRepo.deleteById(id).thenReturn(true);
    }

    @Override
    public Mono<Achievement> findById(Integer id) {
        return achievementRepo.findById(id);
    }

    @Override
    public Mono<PaginatedResponse<Achievement>> findAll(int page, int limit) {
        int offset = page * limit;
        return achievementRepo.findAllWithPagination(limit, offset)
                .collectList()
                .zipWith(achievementRepo.countAll())
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit));
    }

    @Override
    public Mono<PaginatedResponse<Achievement>> findByMemberId(Integer memberId, int page, int limit) {
        int offset = page * limit;
        return achievementRepo.findByMemberId(memberId, limit, offset)
                .collectList()
                .zipWith(achievementRepo.countByMemberId(memberId))
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit));
    }

    @Override
    public Mono<PaginatedResponse<Achievement>> findByStatus(String status, int page, int limit) {
        int offset = page * limit;
        return achievementRepo.findByStatus(status, limit, offset)
                .collectList()
                .zipWith(achievementRepo.countByStatus(status))
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit));
    }

    @Override
    public Mono<PaginatedResponse<Achievement>> search(String keyword, int page, int limit) {
        int offset = page * limit;
        return achievementRepo.searchAchievements(keyword, limit, offset)
                .collectList()
                .zipWith(achievementRepo.countSearchAchievements(keyword))
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit));
    }
}
