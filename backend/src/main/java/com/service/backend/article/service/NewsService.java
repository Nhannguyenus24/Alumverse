package com.service.backend.article.service;

import com.service.backend.article.dao.NewsR2dbcRepository;
import com.service.backend.shared.entity.News;
import com.service.backend.article.dto.CreateNewsRequest;
import com.service.backend.article.dto.UpdateNewsRequest;
import com.service.backend.article.dto.NewsResponse;
import com.service.backend.article.dto.NewsListItemResponse;
import com.service.backend.article.dto.PublishedNewsResponse;
import com.service.backend.article.validation.ArticleTopicCatalog;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.service.ImageService;
import com.service.backend.shared.utils.PaginationHelper;
import com.service.backend.shared.utils.SecurityUtils;
import com.service.backend.shared.utils.CacheNames;
import com.service.backend.shared.utils.CacheUtils;
import com.service.backend.user.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class NewsService {

    private static final Duration LIST_TTL = Duration.ofMinutes(5);

    private final NewsR2dbcRepository newsRepository;
    private final ImageService imageService;
    private final CacheUtils cacheUtils;
    private final NotificationService notificationService;

    /**
     * Clears the news list cache and the admin content-statistics cache. Called by every write that
     * changes what the news lists (getAll/getPublished/search) or the content counts return:
     * create/update/delete/publish/hide.
     */
    private Mono<Void> evictNewsCaches() {
        return cacheUtils.clear(CacheNames.NEWS)
                .then(cacheUtils.clear(CacheNames.ADMIN_CONTENT_STATISTICS));
    }

    public Mono<NewsResponse> create(CreateNewsRequest request) {
        String topic = ArticleTopicCatalog.requireValid(ArticleTopicCatalog.Channel.NEWS, request.getTopic());
        return Mono.zip(SecurityUtils.getCurrentUserId(), SecurityUtils.getCurrentUserRole())
                .flatMap(ctx -> {
                    Long userId = ctx.getT1();
                    String role = ctx.getT2();
                    boolean publishImmediately = "ADMIN".equalsIgnoreCase(role) || "STAFF".equalsIgnoreCase(role);
                    return SecurityUtils.resolveContentOrganizationId(request.getOrganizationId())
                            .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.BAD_REQUEST, "Organization ID is required to create news")))
                            .flatMap(orgId -> SecurityUtils.assertCanManageContentOrganization(orgId)
                                    .then(imageService.uploadBase64IfPresent(request.getThumbnailBase64())
                            .defaultIfEmpty("")
                            .flatMap(thumbnailUrl -> {
                                News news = News.builder()
                                        .organizationId(orgId)
                                        .authorMemberId(userId.intValue())
                                        .title(request.getTitle())
                                        .slug(request.getSlug())
                                        .content(request.getContent())
                                        .thumbnailUrl(thumbnailUrl.isEmpty() ? null : thumbnailUrl)
                                        .topic(topic)
                                        .url(request.getUrl())
                                        .isHidden(!publishImmediately)
                                        .build();

                                return newsRepository.save(news)
                                        .delayUntil(res -> evictNewsCaches())
                                        .doOnNext(saved -> {
                                            if (!publishImmediately) {
                                                notificationService.createNotificationAsync(
                                                        saved.getAuthorMemberId(),
                                                        "Bài viết đã được gửi",
                                                        "Bài viết \"" + saved.getTitle() + "\" đã được gửi. Admin sẽ xem xét trước khi hiển thị công khai.",
                                                        "/news"
                                                );
                                            }
                                        })
                                        .map(NewsResponse::from);
                            })));
                });
    }

    public Mono<NewsResponse> update(Integer id, UpdateNewsRequest request) {
        String topic = request.getTopic() != null
                ? ArticleTopicCatalog.requireValid(ArticleTopicCatalog.Channel.NEWS, request.getTopic())
                : null;
        return newsRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.NEWS_NOT_FOUND, "News not found with id: " + id)))
                .flatMap(existing -> SecurityUtils.assertCanManageContentOrganization(existing.getOrganizationId())
                        .then(imageService.uploadBase64IfPresent(request.getThumbnailBase64())
                        .defaultIfEmpty("")
                        .flatMap(thumbnailUrl -> {
                            existing.setTitle(request.getTitle());
                            existing.setSlug(request.getSlug());
                            existing.setContent(request.getContent());
                            existing.setThumbnailUrl(thumbnailUrl.isEmpty() ? existing.getThumbnailUrl() : thumbnailUrl);
                            if (request.getTopic() != null) existing.setTopic(topic);
                            if (request.getUrl() != null) existing.setUrl(request.getUrl());
                            return newsRepository.save(existing);
                        })))
                .delayUntil(res -> evictNewsCaches())
                .map(NewsResponse::from);
    }

    public Mono<Boolean> delete(Integer id) {
        return newsRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.NEWS_NOT_FOUND, "News not found with id: " + id)))
                .flatMap(existing -> SecurityUtils.assertCanManageContentOrganization(existing.getOrganizationId())
                        .then(newsRepository.deleteById(id))
                        .then(evictNewsCaches())
                        .thenReturn(true));
    }

    public Mono<NewsResponse> getById(Integer id) {
        return newsRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.NEWS_NOT_FOUND, "News not found with id: " + id)))
                .map(NewsResponse::from);
    }

    public Mono<NewsResponse> getPublicById(Integer id, Integer organizationId) {
        return SecurityUtils.resolvePublicOrganizationId(organizationId)
                .flatMap(orgId -> newsRepository.findById(id)
                        .filter(news -> orgId.equals(news.getOrganizationId()))
                        .flatMap(news -> !Boolean.TRUE.equals(news.getIsHidden())
                                ? Mono.just(news)
                                : SecurityUtils.canManageContentOrganization(news.getOrganizationId())
                                        .filter(Boolean::booleanValue)
                                        .map(ignored -> news)))
                .switchIfEmpty(Mono.error(new ApplicationException(
                        ErrorCode.NEWS_NOT_FOUND, "Published news not found")))
                .map(NewsResponse::from);
    }

    public Mono<NewsResponse> getBySlug(String slug) {
        return newsRepository.findBySlug(slug)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.NEWS_NOT_FOUND, "News not found with slug: " + slug)))
                .map(NewsResponse::from);
    }

    public Mono<NewsResponse> getPublicBySlug(String slug, Integer organizationId) {
        return SecurityUtils.resolvePublicOrganizationId(organizationId)
                .flatMap(orgId -> newsRepository.findBySlug(slug)
                        .filter(news -> orgId.equals(news.getOrganizationId())
                                && !Boolean.TRUE.equals(news.getIsHidden())))
                .switchIfEmpty(Mono.error(new ApplicationException(
                        ErrorCode.NEWS_NOT_FOUND, "Published news not found")))
                .map(NewsResponse::from);
    }

    public Mono<PaginatedResponse<NewsResponse>> getAll(int page, int limit) {
        int offset = page * limit;
        return SecurityUtils.getCurrentOrganizationId()
                .flatMap(orgId -> cacheUtils.getOrCompute(CacheNames.NEWS,
                        "all_org_" + orgId + "_p" + page + "_l" + limit, LIST_TTL, () -> PaginationHelper.paginate(
                                newsRepository.findByOrganizationIdWithPagination(orgId, limit, offset).map(NewsResponse::from),
                                newsRepository.countByOrganizationId(orgId),
                                page, limit)))
                .switchIfEmpty(Mono.defer(() -> cacheUtils.getOrCompute(CacheNames.NEWS,
                        "all_global_p" + page + "_l" + limit, LIST_TTL, () -> PaginationHelper.paginate(
                                newsRepository.findAllWithPagination(limit, offset).map(NewsResponse::from),
                                newsRepository.count(),
                                page, limit))));
    }

    public Mono<PaginatedResponse<NewsResponse>> getPublished(int page, int limit, Integer organizationId) {
        int offset = page * limit;
        return SecurityUtils.resolvePublicOrganizationId(organizationId)
                .flatMap(orgId -> cacheUtils.getOrCompute(CacheNames.NEWS,
                        "published_org_" + orgId + "_p" + page + "_l" + limit, LIST_TTL, () -> PaginationHelper.paginate(
                                newsRepository.findPublishedByOrganizationId(orgId, limit, offset).map(NewsResponse::from),
                                newsRepository.countPublishedByOrganizationId(orgId),
                                page, limit)))
                .switchIfEmpty(Mono.just(PaginatedResponse.of(java.util.List.of(), 0, page, limit)));
    }

    public Mono<PublishedNewsResponse> getPublishedList(
            int page,
            int limit,
            Integer organizationId,
            String keyword,
            String topics,
            LocalDate fromDate,
            LocalDate toDate,
            String sort) {
        String normalizedKeyword = keyword == null ? "" : keyword.trim();
        String normalizedTopics = normalizeTopics(topics);
        String normalizedSort = "oldest".equalsIgnoreCase(sort) ? "oldest" : "newest";
        String from = fromDate == null ? "" : fromDate.toString();
        String to = toDate == null ? "" : toDate.toString();
        int offset = page * limit;

        return SecurityUtils.resolvePublicOrganizationId(organizationId)
                .flatMap(orgId -> {
                    String cacheKey = String.join("|",
                            "published-v2",
                            "org=" + orgId,
                            "page=" + page,
                            "limit=" + limit,
                            "keyword=" + normalizedKeyword.toLowerCase(Locale.ROOT),
                            "topics=" + normalizedTopics,
                            "from=" + from,
                            "to=" + to,
                            "sort=" + normalizedSort);

                    return cacheUtils.getOrCompute(CacheNames.NEWS, cacheKey, LIST_TTL,
                            () -> newsRepository.findPublishedFeatured(orgId)
                                    .map(Optional::of)
                                    .defaultIfEmpty(Optional.empty())
                                    .flatMap(featuredOptional -> {
                                        NewsListItemResponse featured = featuredOptional.orElse(null);
                                        int featuredId = featured == null ? -1 : featured.getId();
                                        Mono<List<NewsListItemResponse>> items = newsRepository.findPublishedList(
                                                        orgId, featuredId, normalizedKeyword, normalizedTopics,
                                                        from, to, normalizedSort, limit, offset)
                                                .collectList();
                                        Mono<Long> total = newsRepository.countPublishedList(
                                                orgId, featuredId, normalizedKeyword, normalizedTopics, from, to);

                                        return Mono.zip(items, total)
                                                .map(result -> PublishedNewsResponse.of(
                                                        featured, result.getT1(), result.getT2(), page, limit));
                                    }));
                })
                .switchIfEmpty(Mono.just(PublishedNewsResponse.of(
                        null, List.of(), 0, page, limit)));
    }

    private String normalizeTopics(String topics) {
        if (topics == null || topics.isBlank()) {
            return "";
        }

        return Arrays.stream(topics.split(","))
                .map(topic -> ArticleTopicCatalog.requireValid(ArticleTopicCatalog.Channel.NEWS, topic))
                .distinct()
                .sorted(Comparator.naturalOrder())
                .reduce((left, right) -> left + "," + right)
                .orElse("");
    }

    public Mono<PaginatedResponse<NewsResponse>> search(String keyword, int page, int limit) {
        return search(keyword, page, limit, null);
    }

    public Mono<PaginatedResponse<NewsResponse>> search(String keyword, int page, int limit, Integer organizationId) {
        int offset = page * limit;
        return SecurityUtils.resolvePublicOrganizationId(organizationId)
                .flatMap(orgId -> cacheUtils.getOrCompute(CacheNames.NEWS,
                        "search_org_" + orgId + "_kw_" + keyword + "_p" + page + "_l" + limit, LIST_TTL, () -> PaginationHelper.paginate(
                                newsRepository.searchNews(orgId, keyword, limit, offset).map(NewsResponse::from),
                                newsRepository.countSearchNews(orgId, keyword),
                                page, limit)))
                .switchIfEmpty(Mono.just(PaginatedResponse.of(java.util.List.of(), 0, page, limit)));
    }

    public Mono<NewsResponse> publish(Integer id) {
        return newsRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.NEWS_NOT_FOUND, "News not found with id: " + id)))
                .flatMap(existing -> SecurityUtils.assertCanManageContentOrganization(existing.getOrganizationId())
                        .then(newsRepository.publishNews(id))
                        .then(newsRepository.findById(id)))
                .delayUntil(updated -> evictNewsCaches())
                .doOnNext(updated -> notificationService.createNotificationAsync(
                        updated.getAuthorMemberId(),
                        "Bài viết đã được duyệt",
                        "Bài viết \"" + updated.getTitle() + "\" đã được duyệt và hiển thị công khai.",
                        "/article/news/" + updated.getId()
                ))
                .map(NewsResponse::from);
    }

    public Mono<NewsResponse> hide(Integer id) {
        return newsRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.NEWS_NOT_FOUND, "News not found with id: " + id)))
                .flatMap(existing -> SecurityUtils.assertCanManageContentOrganization(existing.getOrganizationId())
                        .then(newsRepository.hideNews(id))
                        .then(newsRepository.findById(id)))
                .delayUntil(updated -> evictNewsCaches())
                .doOnNext(updated -> notificationService.createNotificationAsync(
                        updated.getAuthorMemberId(),
                        "Bài viết bị gỡ đăng",
                        "Bài viết \"" + updated.getTitle() + "\" đã bị gỡ khỏi trang công khai.",
                        "/news"
                ))
                .map(NewsResponse::from);
    }
}
