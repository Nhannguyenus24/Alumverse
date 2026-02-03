package com.service.backend.article.dao;

import com.service.backend.article.domain.entity.LearningResource;
import com.service.backend.article.domain.repository.ILearningResourceRepository;
import com.service.backend.article.presentation.dto.response.PaginatedResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Repository
@RequiredArgsConstructor
public class LearningResourceRepository implements ILearningResourceRepository {

    private final LearningResourceR2dbcRepository resourceRepo;

    @Override
    public Mono<LearningResource> create(LearningResource resource) {
        resource.setCreatedAt(LocalDateTime.now());
        return resourceRepo.save(resource);
    }

    @Override
    public Mono<LearningResource> update(Integer id, LearningResource resource) {
        return resourceRepo.findById(id)
                .flatMap(existing -> {
                    existing.setTitle(resource.getTitle());
                    existing.setType(resource.getType());
                    existing.setLinkUrl(resource.getLinkUrl());
                    existing.setDescription(resource.getDescription());
                    return resourceRepo.save(existing);
                });
    }

    @Override
    public Mono<Boolean> delete(Integer id) {
        return resourceRepo.deleteById(id).thenReturn(true);
    }

    @Override
    public Mono<LearningResource> findById(Integer id) {
        return resourceRepo.findById(id);
    }

    @Override
    public Mono<PaginatedResponse<LearningResource>> findByOrganizationId(Integer organizationId, int page, int limit) {
        int offset = page * limit;
        return resourceRepo.findByOrganizationIdWithPagination(organizationId, limit, offset)
                .collectList()
                .zipWith(resourceRepo.countByOrganizationId(organizationId))
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit));
    }

    @Override
    public Mono<PaginatedResponse<LearningResource>> findByType(Integer organizationId, String type, int page, int limit) {
        int offset = page * limit;
        return resourceRepo.findByType(organizationId, type, limit, offset)
                .collectList()
                .zipWith(resourceRepo.countByType(organizationId, type))
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit));
    }

    @Override
    public Mono<PaginatedResponse<LearningResource>> search(Integer organizationId, String keyword, int page, int limit) {
        int offset = page * limit;
        return resourceRepo.searchResources(organizationId, keyword, limit, offset)
                .collectList()
                .zipWith(resourceRepo.countSearchResources(organizationId, keyword))
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit));
    }
}
