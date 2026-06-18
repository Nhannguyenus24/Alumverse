package com.service.backend.article.service;

import com.service.backend.article.dao.AlumniPostR2dbcRepository;
import com.service.backend.shared.entity.AlumniPost;
import com.service.backend.article.dto.CreateAlumniPostRequest;
import com.service.backend.article.dto.UpdateAlumniPostRequest;
import com.service.backend.article.dto.AlumniPostResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.service.ImageService;
import com.service.backend.shared.utils.PaginationHelper;
import com.service.backend.shared.utils.SecurityUtils;
import com.service.backend.shared.utils.CacheUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class AlumniPostService {

    private final AlumniPostR2dbcRepository alumniPostRepository;
    private final ImageService imageService;
    private final CacheUtils cacheUtils;

    public Mono<AlumniPostResponse> create(CreateAlumniPostRequest request) {
        return Mono.zip(SecurityUtils.getCurrentUserId(), SecurityUtils.getCurrentOrganizationId())
                .flatMap(ctx -> {
                    Long userId = ctx.getT1();
                    Integer orgId = ctx.getT2();
                    return imageService.uploadBase64IfPresent(request.getThumbnailBase64())
                            .defaultIfEmpty(request.getThumbnailUrl() == null ? "" : request.getThumbnailUrl())
                            .flatMap(thumbnailUrl -> {
                                AlumniPost post = AlumniPost.builder()
                                        .organizationId(orgId)
                                        .authorMemberId(userId.intValue())
                                        .title(request.getTitle())
                                        .slug(request.getSlug())
                                        .content(request.getContent())
                                        .thumbnailUrl(thumbnailUrl.isEmpty() ? null : thumbnailUrl)
                                        .topic(request.getTopic())
                                        .url(request.getUrl())
                                        .isHidden(true)
                                        .build();

                                return alumniPostRepository.save(post)
                                        .delayUntil(res -> cacheUtils.clear("admin_content_statistics"))
                                        .map(AlumniPostResponse::from);
                            });
                });
    }

    public Mono<AlumniPostResponse> update(Integer id, UpdateAlumniPostRequest request) {
        return alumniPostRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.ALUMNI_POST_NOT_FOUND, "Alumni post not found with id: " + id)))
                .flatMap(existing -> imageService.uploadBase64IfPresent(request.getThumbnailBase64())
                        .defaultIfEmpty(request.getThumbnailUrl() == null ? "" : request.getThumbnailUrl())
                        .flatMap(thumbnailUrl -> {
                            existing.setTitle(request.getTitle());
                            existing.setSlug(request.getSlug());
                            existing.setContent(request.getContent());
                            existing.setThumbnailUrl(thumbnailUrl.isEmpty() ? existing.getThumbnailUrl() : thumbnailUrl);
                            if (request.getTopic() != null) existing.setTopic(request.getTopic());
                            if (request.getUrl() != null) existing.setUrl(request.getUrl());
                            return alumniPostRepository.save(existing);
                        }))
                .delayUntil(res -> cacheUtils.clear("admin_content_statistics"))
                .map(AlumniPostResponse::from);
    }

    public Mono<Boolean> delete(Integer id) {
        return alumniPostRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.ALUMNI_POST_NOT_FOUND, "Alumni post not found with id: " + id)))
                .flatMap(existing -> alumniPostRepository.deleteById(id)
                        .delayUntil(res -> cacheUtils.clear("admin_content_statistics"))
                        .thenReturn(true));
    }

    public Mono<AlumniPostResponse> getById(Integer id) {
        return alumniPostRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.ALUMNI_POST_NOT_FOUND, "Alumni post not found with id: " + id)))
                .map(AlumniPostResponse::from);
    }

    public Mono<AlumniPostResponse> getBySlug(String slug) {
        return alumniPostRepository.findBySlug(slug)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.ALUMNI_POST_NOT_FOUND, "Alumni post not found with slug: " + slug)))
                .map(AlumniPostResponse::from);
    }

    public Mono<PaginatedResponse<AlumniPostResponse>> getAll(int page, int limit) {
        int offset = page * limit;
        return SecurityUtils.getCurrentOrganizationId()
                .flatMap(orgId -> PaginationHelper.paginate(
                        alumniPostRepository.findByOrganizationIdWithPagination(orgId, limit, offset).map(AlumniPostResponse::from),
                        alumniPostRepository.countByOrganizationId(orgId),
                        page, limit))
                .switchIfEmpty(Mono.defer(() -> PaginationHelper.paginate(
                        alumniPostRepository.findAllWithPagination(limit, offset).map(AlumniPostResponse::from),
                        alumniPostRepository.count(),
                        page, limit)));
    }

    public Mono<PaginatedResponse<AlumniPostResponse>> getPublished(int page, int limit) {
        int offset = page * limit;
        return SecurityUtils.getCurrentOrganizationId()
                .flatMap(orgId -> PaginationHelper.paginate(
                        alumniPostRepository.findPublishedByOrganizationId(orgId, limit, offset).map(AlumniPostResponse::from),
                        alumniPostRepository.countPublishedByOrganizationId(orgId),
                        page, limit))
                .switchIfEmpty(Mono.defer(() -> PaginationHelper.paginate(
                        alumniPostRepository.findAll()
                                .filter(p -> !p.getIsHidden())
                                .skip(offset)
                                .take(limit)
                                .map(AlumniPostResponse::from),
                        alumniPostRepository.count(),
                        page, limit)));
    }

    public Mono<PaginatedResponse<AlumniPostResponse>> getByAuthorMemberId(Integer authorMemberId, int page, int limit) {
        int offset = page * limit;
        return PaginationHelper.paginate(
                alumniPostRepository.findByAuthorMemberIdWithPagination(authorMemberId, limit, offset).map(AlumniPostResponse::from),
                alumniPostRepository.countByAuthorMemberId(authorMemberId),
                page, limit)
                .doOnSuccess(r -> org.slf4j.LoggerFactory.getLogger(AlumniPostService.class).info("getByAuthorMemberId result: {}", com.service.backend.shared.utils.JsonUtils.toJson(r)));
    }

    public Mono<PaginatedResponse<AlumniPostResponse>> search(String keyword, int page, int limit) {
        int offset = page * limit;
        return SecurityUtils.getCurrentOrganizationId()
                .flatMap(orgId -> PaginationHelper.paginate(
                        alumniPostRepository.searchAlumniPosts(orgId, keyword, limit, offset).map(AlumniPostResponse::from),
                        alumniPostRepository.countSearchAlumniPosts(orgId, keyword),
                        page, limit))
                .switchIfEmpty(Mono.defer(() -> PaginationHelper.paginate(
                        alumniPostRepository.searchAllByTitleWithPagination(keyword, limit, offset).map(AlumniPostResponse::from),
                        alumniPostRepository.countAllSearchByTitle(keyword),
                        page, limit)));
    }

    public Mono<AlumniPostResponse> publish(Integer id) {
        return alumniPostRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.ALUMNI_POST_NOT_FOUND, "Alumni post not found with id: " + id)))
                .flatMap(existing -> alumniPostRepository.publishAlumniPost(id).then(alumniPostRepository.findById(id)))
                .map(AlumniPostResponse::from);
    }

    public Mono<AlumniPostResponse> hide(Integer id) {
        return alumniPostRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.ALUMNI_POST_NOT_FOUND, "Alumni post not found with id: " + id)))
                .flatMap(existing -> alumniPostRepository.hideAlumniPost(id).then(alumniPostRepository.findById(id)))
                .map(AlumniPostResponse::from);
    }
}
