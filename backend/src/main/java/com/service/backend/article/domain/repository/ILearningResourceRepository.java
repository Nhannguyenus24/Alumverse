package com.service.backend.article.domain.repository;

import com.service.backend.article.domain.entity.LearningResource;
import com.service.backend.article.presentation.dto.response.PaginatedResponse;
import reactor.core.publisher.Mono;

public interface ILearningResourceRepository {

    Mono<LearningResource> create(LearningResource resource);

    Mono<LearningResource> update(Integer id, LearningResource resource);

    Mono<Boolean> delete(Integer id);

    Mono<LearningResource> findById(Integer id);

    Mono<PaginatedResponse<LearningResource>> findByOrganizationId(Integer organizationId, int page, int limit);

    Mono<PaginatedResponse<LearningResource>> findByType(Integer organizationId, String type, int page, int limit);

    Mono<PaginatedResponse<LearningResource>> search(Integer organizationId, String keyword, int page, int limit);
}
