package com.service.backend.article.domain.repository;

import com.service.backend.article.domain.entity.Achievement;
import com.service.backend.article.presentation.dto.response.PaginatedResponse;
import reactor.core.publisher.Mono;

public interface IAchievementRepository {

    Mono<Achievement> create(Achievement achievement);

    Mono<Achievement> update(Integer id, Achievement achievement);

    Mono<Boolean> delete(Integer id);

    Mono<Achievement> findById(Integer id);

    Mono<PaginatedResponse<Achievement>> findAll(int page, int limit);

    Mono<PaginatedResponse<Achievement>> findByMemberId(Integer memberId, int page, int limit);

    Mono<PaginatedResponse<Achievement>> findByStatus(String status, int page, int limit);

    Mono<PaginatedResponse<Achievement>> search(String keyword, int page, int limit);
}
