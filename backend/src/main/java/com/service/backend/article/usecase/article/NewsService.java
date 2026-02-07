package com.service.backend.article.usecase.article;

import com.service.backend.article.dao.NewsR2dbcRepository;
import com.service.backend.article.domain.entity.News;
import com.service.backend.article.presentation.dto.request.CreateNewsRequest;
import com.service.backend.article.presentation.dto.request.UpdateNewsRequest;
import com.service.backend.article.presentation.dto.response.NewsResponse;
import com.service.backend.article.presentation.dto.response.PaginatedResponse;
import com.service.backend.shared.constants.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class NewsService {

    private final NewsR2dbcRepository newsRepository;

    private static final Integer MOCK_ORGANIZATION_ID = 1;
    private static final Integer MOCK_AUTHOR_MEMBER_ID = 1;

    public Mono<NewsResponse> create(CreateNewsRequest request) {
        News news = News.builder()
                .organizationId(MOCK_ORGANIZATION_ID)
                .authorMemberId(MOCK_AUTHOR_MEMBER_ID)
                .title(request.getTitle())
                .slug(request.getSlug())
                .content(request.getContent())
                .thumbnailUrl(request.getThumbnailUrl())
                .isHidden(true)
                .build();

        return newsRepository.save(news)
                .map(NewsResponse::from);
    }

    public Mono<NewsResponse> update(Integer id, UpdateNewsRequest request) {
        return newsRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.NEWS_NOT_FOUND, "News not found with id: " + id)))
                .flatMap(existing -> {
                    existing.setTitle(request.getTitle());
                    existing.setSlug(request.getSlug());
                    existing.setContent(request.getContent());
                    existing.setThumbnailUrl(request.getThumbnailUrl());
                    return newsRepository.save(existing);
                })
                .map(NewsResponse::from);
    }

    public Mono<Boolean> delete(Integer id) {
        return newsRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.NEWS_NOT_FOUND, "News not found with id: " + id)))
                .flatMap(existing -> newsRepository.deleteById(id).thenReturn(true));
    }

    public Mono<NewsResponse> getById(Integer id) {
        return newsRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.NEWS_NOT_FOUND, "News not found with id: " + id)))
                .map(NewsResponse::from);
    }

    public Mono<NewsResponse> getBySlug(String slug) {
        return newsRepository.findBySlug(slug)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.NEWS_NOT_FOUND, "News not found with slug: " + slug)))
                .map(NewsResponse::from);
    }

    public Mono<PaginatedResponse<NewsResponse>> getAll(int page, int limit) {
        int offset = page * limit;
        return newsRepository.findByOrganizationIdWithPagination(MOCK_ORGANIZATION_ID, limit, offset)
                .collectList()
                .zipWith(newsRepository.countByOrganizationId(MOCK_ORGANIZATION_ID))
                .map(tuple -> PaginatedResponse.of(
                        tuple.getT1().stream().map(NewsResponse::from).toList(),
                        tuple.getT2(), page, limit
                ));
    }

    public Mono<PaginatedResponse<NewsResponse>> getPublished(int page, int limit) {
        int offset = page * limit;
        return newsRepository.findPublishedByOrganizationId(MOCK_ORGANIZATION_ID, limit, offset)
                .collectList()
                .zipWith(newsRepository.countPublishedByOrganizationId(MOCK_ORGANIZATION_ID))
                .map(tuple -> PaginatedResponse.of(
                        tuple.getT1().stream().map(NewsResponse::from).toList(),
                        tuple.getT2(), page, limit
                ));
    }

    public Mono<PaginatedResponse<NewsResponse>> search(String keyword, int page, int limit) {
        int offset = page * limit;
        return newsRepository.searchNews(MOCK_ORGANIZATION_ID, keyword, limit, offset)
                .collectList()
                .zipWith(newsRepository.countSearchNews(MOCK_ORGANIZATION_ID, keyword))
                .map(tuple -> PaginatedResponse.of(
                        tuple.getT1().stream().map(NewsResponse::from).toList(),
                        tuple.getT2(), page, limit
                ));
    }

    public Mono<NewsResponse> publish(Integer id) {
        return newsRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.NEWS_NOT_FOUND, "News not found with id: " + id)))
                .flatMap(existing -> newsRepository.publishNews(id).then(newsRepository.findById(id)))
                .map(NewsResponse::from);
    }

    public Mono<NewsResponse> hide(Integer id) {
        return newsRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.NEWS_NOT_FOUND, "News not found with id: " + id)))
                .flatMap(existing -> newsRepository.hideNews(id).then(newsRepository.findById(id)))
                .map(NewsResponse::from);
    }
}
