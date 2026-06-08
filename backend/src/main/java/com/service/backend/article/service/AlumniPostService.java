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
import com.service.backend.shared.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class AlumniPostService {

    private final AlumniPostR2dbcRepository alumniPostRepository;
    private final ImageService imageService;

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
                                        .isHidden(true)
                                        .build();

                                return alumniPostRepository.save(post).map(AlumniPostResponse::from);
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
                            return alumniPostRepository.save(existing);
                        }))
                .map(AlumniPostResponse::from);
    }

    public Mono<Boolean> delete(Integer id) {
        return alumniPostRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.ALUMNI_POST_NOT_FOUND, "Alumni post not found with id: " + id)))
                .flatMap(existing -> alumniPostRepository.deleteById(id).thenReturn(true));
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
                .flatMap(orgId -> alumniPostRepository.findByOrganizationIdWithPagination(orgId, limit, offset)
                        .collectList()
                        .zipWith(alumniPostRepository.countByOrganizationId(orgId)))
                .switchIfEmpty(Mono.defer(() -> alumniPostRepository.findAllWithPagination(limit, offset)
                        .collectList()
                        .zipWith(alumniPostRepository.count())))
                .map(tuple -> PaginatedResponse.of(
                        tuple.getT1().stream().map(AlumniPostResponse::from).toList(),
                        tuple.getT2(), page, limit
                ));
    }

    public Mono<PaginatedResponse<AlumniPostResponse>> getPublished(int page, int limit) {
        int offset = page * limit;
        return SecurityUtils.getCurrentOrganizationId()
                .flatMap(orgId -> alumniPostRepository.findPublishedByOrganizationId(orgId, limit, offset)
                        .collectList()
                        .zipWith(alumniPostRepository.countPublishedByOrganizationId(orgId)))
                .switchIfEmpty(Mono.defer(() -> alumniPostRepository.findAll() // Fallback to all published if no org
                        .filter(p -> !p.getIsHidden())
                        .skip(offset)
                        .take(limit)
                        .collectList()
                        .zipWith(alumniPostRepository.count())))
                .map(tuple -> PaginatedResponse.of(
                        tuple.getT1().stream().map(AlumniPostResponse::from).toList(),
                        tuple.getT2(), page, limit
                ));
    }

    public Mono<PaginatedResponse<AlumniPostResponse>> search(String keyword, int page, int limit) {
        int offset = page * limit;
        return SecurityUtils.getCurrentOrganizationId()
                .flatMap(orgId -> alumniPostRepository.searchAlumniPosts(orgId, keyword, limit, offset)
                        .collectList()
                        .zipWith(alumniPostRepository.countSearchAlumniPosts(orgId, keyword)))
                .switchIfEmpty(Mono.defer(() -> alumniPostRepository.searchAllByTitleWithPagination(keyword, limit, offset)
                        .collectList()
                        .zipWith(alumniPostRepository.countAllSearchByTitle(keyword))))
                .map(tuple -> PaginatedResponse.of(
                        tuple.getT1().stream().map(AlumniPostResponse::from).toList(),
                        tuple.getT2(), page, limit
                ));
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
