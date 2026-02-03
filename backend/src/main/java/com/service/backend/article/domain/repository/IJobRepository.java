package com.service.backend.article.domain.repository;

import com.service.backend.article.domain.entity.Job;
import com.service.backend.article.presentation.dto.response.PaginatedResponse;
import reactor.core.publisher.Mono;

public interface IJobRepository {

    Mono<Job> create(Job job);

    Mono<Job> update(Integer id, Job job);

    Mono<Boolean> delete(Integer id);

    Mono<Job> findById(Integer id);

    Mono<PaginatedResponse<Job>> findByOrganizationId(Integer organizationId, int page, int limit);

    Mono<PaginatedResponse<Job>> findActive(Integer organizationId, int page, int limit);

    Mono<PaginatedResponse<Job>> findOpenJobs(Integer organizationId, int page, int limit);

    Mono<PaginatedResponse<Job>> search(Integer organizationId, String keyword, int page, int limit);

    Mono<Job> activate(Integer id);

    Mono<Job> deactivate(Integer id);
}
