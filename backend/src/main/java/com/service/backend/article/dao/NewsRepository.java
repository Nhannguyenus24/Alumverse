package com.service.backend.article.dao;

import com.service.backend.article.domain.entity.News;
import com.service.backend.article.domain.repository.INewsRepository;
import com.service.backend.article.presentation.dto.response.PaginatedResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
@RequiredArgsConstructor
public class NewsRepository implements INewsRepository {

    private final NewsR2dbcRepository newsRepo;

    @Override
    public Mono<News> create(News news) {
        news.setIsHidden(true);
        return newsRepo.save(news);
    }

    @Override
    public Mono<News> update(Integer id, News news) {
        return newsRepo.findById(id)
                .flatMap(existing -> {
                    existing.setTitle(news.getTitle());
                    existing.setSlug(news.getSlug());
                    existing.setContent(news.getContent());
                    existing.setThumbnailUrl(news.getThumbnailUrl());
                    return newsRepo.save(existing);
                });
    }

    @Override
    public Mono<Boolean> delete(Integer id) {
        return newsRepo.deleteById(id).thenReturn(true);
    }

    @Override
    public Mono<News> findById(Integer id) {
        return newsRepo.findById(id);
    }

    @Override
    public Mono<News> findBySlug(String slug) {
        return newsRepo.findBySlug(slug);
    }

    @Override
    public Mono<PaginatedResponse<News>> findByOrganizationId(Integer organizationId, int page, int limit) {
        int offset = page * limit;
        return newsRepo.findByOrganizationIdWithPagination(organizationId, limit, offset)
                .collectList()
                .zipWith(newsRepo.countByOrganizationId(organizationId))
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit));
    }

    @Override
    public Mono<PaginatedResponse<News>> findPublished(Integer organizationId, int page, int limit) {
        int offset = page * limit;
        return newsRepo.findPublishedByOrganizationId(organizationId, limit, offset)
                .collectList()
                .zipWith(newsRepo.countPublishedByOrganizationId(organizationId))
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit));
    }

    @Override
    public Mono<PaginatedResponse<News>> search(Integer organizationId, String keyword, int page, int limit) {
        int offset = page * limit;
        return newsRepo.searchNews(organizationId, keyword, limit, offset)
                .collectList()
                .zipWith(newsRepo.countSearchNews(organizationId, keyword))
                .map(tuple -> PaginatedResponse.of(tuple.getT1(), tuple.getT2(), page, limit));
    }

    @Override
    public Mono<News> publish(Integer id) {
        return newsRepo.publishNews(id)
                .then(newsRepo.findById(id));
    }

    @Override
    public Mono<News> hide(Integer id) {
        return newsRepo.hideNews(id)
                .then(newsRepo.findById(id));
    }
}
