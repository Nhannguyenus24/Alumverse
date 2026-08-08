package com.service.backend.article.service;

import com.service.backend.article.dao.AlumniPostR2dbcRepository;
import com.service.backend.shared.entity.AlumniPost;
import com.service.backend.article.dto.CreateAlumniPostRequest;
import com.service.backend.article.dto.UpdateAlumniPostRequest;
import com.service.backend.article.dto.AlumniPostResponse;
import com.service.backend.article.validation.ArticleTopicCatalog;
import com.service.backend.shared.dto.FeaturedPaginatedResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.service.ImageService;
import com.service.backend.shared.utils.HtmlPreviewUtils;
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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AlumniPostService {

    private static final Duration LIST_TTL = Duration.ofMinutes(5);
    private static final int CONTENT_PREVIEW_LENGTH = 260;

    private final AlumniPostR2dbcRepository alumniPostRepository;
    private final ImageService imageService;
    private final CacheUtils cacheUtils;
    private final NotificationService notificationService;

    /**
     * Clears the alumni-post list cache and the admin content-statistics cache. Called by every write
     * that changes what the lists (getAll/getPublished/getByAuthorMemberId/search) or the content counts
     * return: create/update/delete/publish/hide.
     */
    private Mono<Void> evictAlumniPostCaches() {
        return cacheUtils.clear(CacheNames.ALUMNI_POST)
                .then(cacheUtils.clear(CacheNames.ADMIN_CONTENT_STATISTICS));
    }

    public Mono<AlumniPostResponse> create(CreateAlumniPostRequest request) {
        String topic = ArticleTopicCatalog.requireValid(ArticleTopicCatalog.Channel.ALUMNI, request.getTopic());
        return Mono.zip(SecurityUtils.getCurrentUserId(), SecurityUtils.getCurrentUserRole())
                .flatMap(ctx -> {
                    Long userId = ctx.getT1();
                    String role = ctx.getT2();
                    boolean publishImmediately = "ADMIN".equalsIgnoreCase(role) || "STAFF".equalsIgnoreCase(role);
                    return SecurityUtils.resolveContentOrganizationId(request.getOrganizationId())
                            .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.BAD_REQUEST, "Organization ID is required to create alumni post")))
                            .flatMap(orgId -> SecurityUtils.assertCanSubmitContributorContent(orgId)
                                    .then(imageService.uploadBase64IfPresent(request.getThumbnailBase64())
                            .defaultIfEmpty("")
                            .flatMap(thumbnailUrl -> {
                                AlumniPost post = AlumniPost.builder()
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

                                return alumniPostRepository.save(post)
                                        .delayUntil(res -> evictAlumniPostCaches())
                                        .doOnNext(saved -> {
                                            if (!publishImmediately) {
                                                notificationService.createNotificationAsync(
                                                        saved.getAuthorMemberId(),
                                                        "Bài viết đã được gửi",
                                                        "Bài viết \"" + saved.getTitle() + "\" đã được gửi. Admin sẽ xem xét trước khi hiển thị công khai.",
                                                        "/honors/alumni"
                                                );
                                            }
                                        })
                                        .map(AlumniPostResponse::from);
                            })));
                });
    }

    public Mono<AlumniPostResponse> update(Integer id, UpdateAlumniPostRequest request) {
        String topic = request.getTopic() != null
                ? ArticleTopicCatalog.requireValid(ArticleTopicCatalog.Channel.ALUMNI, request.getTopic())
                : null;
        return alumniPostRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.ALUMNI_POST_NOT_FOUND, "Alumni post not found with id: " + id)))
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
                            return alumniPostRepository.save(existing);
                        })))
                .delayUntil(res -> evictAlumniPostCaches())
                .map(AlumniPostResponse::from);
    }

    public Mono<Boolean> delete(Integer id) {
        return alumniPostRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.ALUMNI_POST_NOT_FOUND, "Alumni post not found with id: " + id)))
                .flatMap(existing -> SecurityUtils.assertCanManageContentOrganization(existing.getOrganizationId())
                        .then(alumniPostRepository.deleteById(id))
                        .then(evictAlumniPostCaches())
                        .thenReturn(true));
    }

    public Mono<AlumniPostResponse> getById(Integer id) {
        return alumniPostRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.ALUMNI_POST_NOT_FOUND, "Alumni post not found with id: " + id)))
                .map(AlumniPostResponse::from);
    }

    public Mono<AlumniPostResponse> getPublicById(Integer id, Integer organizationId) {
        return SecurityUtils.resolvePublicOrganizationId(organizationId)
                .flatMap(orgId -> alumniPostRepository.findById(id)
                        .filter(post -> orgId.equals(post.getOrganizationId()))
                        .flatMap(post -> !Boolean.TRUE.equals(post.getIsHidden())
                                ? Mono.just(post)
                                : SecurityUtils.canManageContentOrganization(post.getOrganizationId())
                                        .filter(Boolean::booleanValue)
                                        .map(ignored -> post)))
                .switchIfEmpty(Mono.error(new ApplicationException(
                        ErrorCode.ALUMNI_POST_NOT_FOUND, "Published alumni post not found")))
                .map(AlumniPostResponse::from);
    }

    public Mono<AlumniPostResponse> getBySlug(String slug) {
        return alumniPostRepository.findBySlug(slug)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.ALUMNI_POST_NOT_FOUND, "Alumni post not found with slug: " + slug)))
                .map(AlumniPostResponse::from);
    }

    public Mono<AlumniPostResponse> getPublicBySlug(String slug, Integer organizationId) {
        return SecurityUtils.resolvePublicOrganizationId(organizationId)
                .flatMap(orgId -> alumniPostRepository.findBySlug(slug)
                        .filter(post -> orgId.equals(post.getOrganizationId())
                                && !Boolean.TRUE.equals(post.getIsHidden())))
                .switchIfEmpty(Mono.error(new ApplicationException(
                        ErrorCode.ALUMNI_POST_NOT_FOUND, "Published alumni post not found")))
                .map(AlumniPostResponse::from);
    }

    public Mono<PaginatedResponse<AlumniPostResponse>> getAll(int page, int limit) {
        int offset = page * limit;
        return SecurityUtils.getCurrentOrganizationId()
                .flatMap(orgId -> cacheUtils.getOrCompute(CacheNames.ALUMNI_POST,
                        "all_org_" + orgId + "_p" + page + "_l" + limit, LIST_TTL, () -> PaginationHelper.paginate(
                                alumniPostRepository.findByOrganizationIdWithPagination(orgId, limit, offset).map(AlumniPostResponse::from),
                                alumniPostRepository.countByOrganizationId(orgId),
                                page, limit)))
                .switchIfEmpty(Mono.defer(() -> cacheUtils.getOrCompute(CacheNames.ALUMNI_POST,
                        "all_global_p" + page + "_l" + limit, LIST_TTL, () -> PaginationHelper.paginate(
                                alumniPostRepository.findAllWithPagination(limit, offset).map(AlumniPostResponse::from),
                                alumniPostRepository.count(),
                                page, limit))));
    }

    public Mono<PaginatedResponse<AlumniPostResponse>> getPublished(int page, int limit, Integer organizationId) {
        int offset = page * limit;
        return SecurityUtils.resolvePublicOrganizationId(organizationId)
                .flatMap(orgId -> cacheUtils.getOrCompute(CacheNames.ALUMNI_POST,
                        "published_org_" + orgId + "_p" + page + "_l" + limit, LIST_TTL, () -> PaginationHelper.paginate(
                                alumniPostRepository.findPublishedByOrganizationId(orgId, limit, offset).map(AlumniPostResponse::from),
                                alumniPostRepository.countPublishedByOrganizationId(orgId),
                                page, limit)))
                .switchIfEmpty(Mono.just(PaginatedResponse.of(java.util.List.of(), 0, page, limit)));
    }

    /**
     * Public alumni-post list for the honors pages: server-side filtering, sorting and pagination,
     * plus a featured item that is excluded from {@code items} (and from the total) so it never
     * appears twice and never shifts the page boundaries.
     */
    public Mono<FeaturedPaginatedResponse<AlumniPostResponse>> getPublishedList(
            int page,
            int limit,
            Integer organizationId,
            String keyword,
            String topics,
            LocalDate fromDate,
            LocalDate toDate,
            String direction) {
        String normalizedKeyword = keyword == null ? "" : keyword.trim();
        String normalizedTopics = normalizeTopics(topics);
        String normalizedDirection = "oldest".equalsIgnoreCase(direction) ? "oldest" : "newest";
        String from = fromDate == null ? "" : fromDate.toString();
        String to = toDate == null ? "" : toDate.toString();
        int offset = page * limit;

        return SecurityUtils.resolvePublicOrganizationId(organizationId)
                .flatMap(orgId -> {
                    String cacheKey = String.join("|",
                            "published-list-v1",
                            "org=" + orgId,
                            "page=" + page,
                            "limit=" + limit,
                            "keyword=" + normalizedKeyword.toLowerCase(Locale.ROOT),
                            "topics=" + normalizedTopics,
                            "from=" + from,
                            "to=" + to,
                            "direction=" + normalizedDirection);

                    return cacheUtils.getOrCompute(CacheNames.ALUMNI_POST, cacheKey, LIST_TTL,
                            () -> alumniPostRepository.findPublicFeatured(
                                            orgId, normalizedKeyword, normalizedTopics, from, to, normalizedDirection)
                                    .map(AlumniPostResponse::from)
                                    .map(this::withContentPreview)
                                    .map(Optional::of)
                                    .defaultIfEmpty(Optional.empty())
                                    .flatMap(featuredOptional -> {
                                        Integer featuredId = featuredOptional
                                                .map(AlumniPostResponse::getId)
                                                .orElse(null);
                                        Mono<List<AlumniPostResponse>> items = alumniPostRepository.findPublicPage(
                                                        orgId, featuredId, normalizedKeyword, normalizedTopics,
                                                        from, to, normalizedDirection, limit, offset)
                                                .map(AlumniPostResponse::from)
                                                .map(this::withContentPreview)
                                                .collectList();
                                        Mono<Long> total = alumniPostRepository.countPublicPage(
                                                orgId, featuredId, normalizedKeyword, normalizedTopics, from, to);

                                        return Mono.zip(items, total)
                                                .map(result -> FeaturedPaginatedResponse.of(
                                                        featuredOptional.orElse(null),
                                                        result.getT1(), result.getT2(), page, limit));
                                    }));
                })
                .switchIfEmpty(Mono.just(FeaturedPaginatedResponse.of(
                        null, List.of(), 0, page, limit)));
    }

    /**
     * Content is rich HTML. List cards only ever render a short excerpt, so strip the markup and
     * bound the length here instead of shipping whole articles down the wire. Detail endpoints
     * intentionally keep returning the full content.
     */
    private AlumniPostResponse withContentPreview(AlumniPostResponse item) {
        item.setContent(HtmlPreviewUtils.toPlainTextPreview(item.getContent(), CONTENT_PREVIEW_LENGTH));
        return item;
    }

    /**
     * Normalizes without validating against the alumni catalog. The /honors overview builds a
     * single topic filter from the union of the alumni and achievement catalogs and sends it to
     * both endpoints, so rejecting an out-of-channel topic here would 400 the whole page. Unknown
     * topics simply reach the query and match nothing, which is the intended result.
     */
    private String normalizeTopics(String topics) {
        if (topics == null || topics.isBlank()) {
            return "";
        }

        return Arrays.stream(topics.split(","))
                .map(ArticleTopicCatalog::normalize)
                .filter(topic -> topic != null && !topic.isBlank())
                .distinct()
                .sorted(Comparator.naturalOrder())
                .collect(Collectors.joining(","));
    }

    public Mono<PaginatedResponse<AlumniPostResponse>> getByAuthorMemberId(
            Integer authorMemberId, Integer organizationId, int page, int limit) {
        int offset = page * limit;
        return SecurityUtils.resolvePublicOrganizationId(organizationId)
                .flatMap(orgId -> cacheUtils.getOrCompute(CacheNames.ALUMNI_POST,
                        "author_" + authorMemberId + "_org_" + orgId + "_p" + page + "_l" + limit, LIST_TTL, () -> PaginationHelper.paginate(
                                alumniPostRepository.findPublishedByAuthorMemberIdAndOrganizationId(authorMemberId, orgId, limit, offset)
                                        .map(AlumniPostResponse::from),
                                alumniPostRepository.countPublishedByAuthorMemberIdAndOrganizationId(authorMemberId, orgId),
                                page, limit)))
                .switchIfEmpty(Mono.just(PaginatedResponse.of(java.util.List.of(), 0, page, limit)));
    }

    public Mono<PaginatedResponse<AlumniPostResponse>> search(String keyword, int page, int limit) {
        return search(keyword, page, limit, null);
    }

    public Mono<PaginatedResponse<AlumniPostResponse>> search(String keyword, int page, int limit, Integer organizationId) {
        int offset = page * limit;
        return SecurityUtils.resolvePublicOrganizationId(organizationId)
                .flatMap(orgId -> cacheUtils.getOrCompute(CacheNames.ALUMNI_POST,
                        "search_org_" + orgId + "_kw_" + keyword + "_p" + page + "_l" + limit, LIST_TTL, () -> PaginationHelper.paginate(
                                alumniPostRepository.searchAlumniPosts(orgId, keyword, limit, offset).map(AlumniPostResponse::from),
                                alumniPostRepository.countSearchAlumniPosts(orgId, keyword),
                                page, limit)))
                .switchIfEmpty(Mono.just(PaginatedResponse.of(java.util.List.of(), 0, page, limit)));
    }

    public Mono<AlumniPostResponse> publish(Integer id) {
        return alumniPostRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.ALUMNI_POST_NOT_FOUND, "Alumni post not found with id: " + id)))
                .flatMap(existing -> SecurityUtils.assertCanManageContentOrganization(existing.getOrganizationId())
                        .then(alumniPostRepository.publishAlumniPost(id))
                        .then(alumniPostRepository.findById(id)))
                .delayUntil(updated -> evictAlumniPostCaches())
                .doOnNext(updated -> notificationService.createNotificationAsync(
                        updated.getAuthorMemberId(),
                        "Bài viết đã được duyệt",
                        "Bài viết \"" + updated.getTitle() + "\" đã được duyệt và hiển thị công khai.",
                        "/article/alumni/" + updated.getId()
                ))
                .map(AlumniPostResponse::from);
    }

    public Mono<AlumniPostResponse> hide(Integer id) {
        return alumniPostRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.ALUMNI_POST_NOT_FOUND, "Alumni post not found with id: " + id)))
                .flatMap(existing -> SecurityUtils.assertCanManageContentOrganization(existing.getOrganizationId())
                        .then(alumniPostRepository.hideAlumniPost(id))
                        .then(alumniPostRepository.findById(id)))
                .delayUntil(updated -> evictAlumniPostCaches())
                .doOnNext(updated -> notificationService.createNotificationAsync(
                        updated.getAuthorMemberId(),
                        "Bài viết bị gỡ đăng",
                        "Bài viết \"" + updated.getTitle() + "\" đã bị gỡ khỏi trang công khai.",
                        "/honors/alumni"
                ))
                .map(AlumniPostResponse::from);
    }
}
