package com.service.backend.article.domain.repository;

import com.service.backend.article.domain.entity.News;
import com.service.backend.article.presentation.dto.response.PaginatedResponse;
import reactor.core.publisher.Mono;

public interface INewsRepository {

    Mono<News> create(News news);

    Mono<News> update(Integer id, News news);

    Mono<Boolean> delete(Integer id);

    Mono<News> findById(Integer id);

    Mono<News> findBySlug(String slug);

    Mono<PaginatedResponse<News>> findByOrganizationId(Integer organizationId, int page, int limit);

    Mono<PaginatedResponse<News>> findPublished(Integer organizationId, int page, int limit);

    Mono<PaginatedResponse<News>> search(Integer organizationId, String keyword, int page, int limit);

    Mono<News> publish(Integer id);

    Mono<News> hide(Integer id);
}
