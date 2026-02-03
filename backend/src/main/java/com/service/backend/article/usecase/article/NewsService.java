package com.service.backend.article.usecase.article;

import com.service.backend.article.domain.entity.News;
import com.service.backend.article.domain.repository.INewsRepository;
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

    private final INewsRepository newsRepository;

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
                .build();

        return newsRepository.create(news)
                .map(NewsResponse::from);
    }

    public Mono<NewsResponse> update(Integer id, UpdateNewsRequest request) {
        return newsRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.NEWS_NOT_FOUND, "News not found with id: " + id)))
                .flatMap(existing -> {
                    News updated = News.builder()
                            .title(request.getTitle())
                            .slug(request.getSlug())
                            .content(request.getContent())
                            .thumbnailUrl(request.getThumbnailUrl())
                            .build();
                    return newsRepository.update(id, updated);
                })
                .map(NewsResponse::from);
    }

    public Mono<Boolean> delete(Integer id) {
        return newsRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.NEWS_NOT_FOUND, "News not found with id: " + id)))
                .flatMap(existing -> newsRepository.delete(id));
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
        return newsRepository.findByOrganizationId(MOCK_ORGANIZATION_ID, page, limit)
                .map(paginatedResponse -> PaginatedResponse.of(
                        paginatedResponse.getItems().stream().map(NewsResponse::from).toList(),
                        paginatedResponse.getTotal(),
                        paginatedResponse.getPage(),
                        paginatedResponse.getLimit()
                ));
    }

    public Mono<PaginatedResponse<NewsResponse>> getPublished(int page, int limit) {
        return newsRepository.findPublished(MOCK_ORGANIZATION_ID, page, limit)
                .map(paginatedResponse -> PaginatedResponse.of(
                        paginatedResponse.getItems().stream().map(NewsResponse::from).toList(),
                        paginatedResponse.getTotal(),
                        paginatedResponse.getPage(),
                        paginatedResponse.getLimit()
                ));
    }

    public Mono<PaginatedResponse<NewsResponse>> search(String keyword, int page, int limit) {
        return newsRepository.search(MOCK_ORGANIZATION_ID, keyword, page, limit)
                .map(paginatedResponse -> PaginatedResponse.of(
                        paginatedResponse.getItems().stream().map(NewsResponse::from).toList(),
                        paginatedResponse.getTotal(),
                        paginatedResponse.getPage(),
                        paginatedResponse.getLimit()
                ));
    }

    public Mono<NewsResponse> publish(Integer id) {
        return newsRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.NEWS_NOT_FOUND, "News not found with id: " + id)))
                .flatMap(existing -> newsRepository.publish(id))
                .map(NewsResponse::from);
    }

    public Mono<NewsResponse> hide(Integer id) {
        return newsRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.NEWS_NOT_FOUND, "News not found with id: " + id)))
                .flatMap(existing -> newsRepository.hide(id))
                .map(NewsResponse::from);
    }
}
