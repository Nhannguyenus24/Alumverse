package com.service.backend.article.usecase;

import com.service.backend.article.dao.NewsR2dbcRepository;
import com.service.backend.article.entity.News;
import com.service.backend.article.dto.CreateNewsRequest;
import com.service.backend.article.dto.UpdateNewsRequest;
import com.service.backend.article.dto.NewsResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.constants.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.service.ImageService;
import com.service.backend.shared.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class NewsService {

    private final NewsR2dbcRepository newsRepository;
    private final ImageService imageService;

    public Mono<NewsResponse> create(CreateNewsRequest request) {
        return Mono.zip(SecurityUtils.getCurrentUserId(), SecurityUtils.getCurrentOrganizationId())
                .flatMap(ctx -> {
                    Long userId = ctx.getT1();
                    Integer orgId = ctx.getT2();
                    return imageService.uploadBase64IfPresent(request.getThumbnailBase64())
                            .defaultIfEmpty(request.getThumbnailUrl() == null ? "" : request.getThumbnailUrl())
                            .flatMap(thumbnailUrl -> {
                                News news = News.builder()
                                        .organizationId(orgId)
                                        .authorMemberId(userId.intValue())
                                        .title(request.getTitle())
                                        .slug(request.getSlug())
                                        .content(request.getContent())
                                        .thumbnailUrl(thumbnailUrl.isEmpty() ? null : thumbnailUrl)
                                        .isHidden(true)
                                        .build();

                                return newsRepository.save(news).map(NewsResponse::from);
                            });
                });
    }

    public Mono<NewsResponse> update(Integer id, UpdateNewsRequest request) {
        return newsRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.NEWS_NOT_FOUND, "News not found with id: " + id)))
                .flatMap(existing -> imageService.uploadBase64IfPresent(request.getThumbnailBase64())
                        .defaultIfEmpty(request.getThumbnailUrl() == null ? "" : request.getThumbnailUrl())
                        .flatMap(thumbnailUrl -> {
                            existing.setTitle(request.getTitle());
                            existing.setSlug(request.getSlug());
                            existing.setContent(request.getContent());
                            existing.setThumbnailUrl(thumbnailUrl.isEmpty() ? existing.getThumbnailUrl() : thumbnailUrl);
                            return newsRepository.save(existing);
                        }))
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
        return SecurityUtils.getCurrentOrganizationId().flatMap(orgId ->
                newsRepository.findByOrganizationIdWithPagination(orgId, limit, offset)
                        .collectList()
                        .zipWith(newsRepository.countByOrganizationId(orgId))
                        .map(tuple -> PaginatedResponse.of(
                                tuple.getT1().stream().map(NewsResponse::from).toList(),
                                tuple.getT2(), page, limit
                        )));
    }

    public Mono<PaginatedResponse<NewsResponse>> getPublished(int page, int limit) {
        int offset = page * limit;
        return SecurityUtils.getCurrentOrganizationId().flatMap(orgId ->
                newsRepository.findPublishedByOrganizationId(orgId, limit, offset)
                        .collectList()
                        .zipWith(newsRepository.countPublishedByOrganizationId(orgId))
                        .map(tuple -> PaginatedResponse.of(
                                tuple.getT1().stream().map(NewsResponse::from).toList(),
                                tuple.getT2(), page, limit
                        )));
    }

    public Mono<PaginatedResponse<NewsResponse>> search(String keyword, int page, int limit) {
        int offset = page * limit;
        return SecurityUtils.getCurrentOrganizationId().flatMap(orgId ->
                newsRepository.searchNews(orgId, keyword, limit, offset)
                        .collectList()
                        .zipWith(newsRepository.countSearchNews(orgId, keyword))
                        .map(tuple -> PaginatedResponse.of(
                                tuple.getT1().stream().map(NewsResponse::from).toList(),
                                tuple.getT2(), page, limit
                        )));
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
