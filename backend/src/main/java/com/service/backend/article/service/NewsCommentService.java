package com.service.backend.article.service;

import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.service.backend.article.dao.NewsCommentRepository;
import com.service.backend.article.dao.NewsR2dbcRepository;
import com.service.backend.article.dto.CreateNewsCommentRequest;
import com.service.backend.article.dto.NewsCommentDTO;
import com.service.backend.article.dto.UpdateNewsCommentRequest;
import com.service.backend.shared.dao.UserDisplayInfo;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.entity.NewsComment;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.utils.PaginationHelper;
import com.service.backend.shared.utils.SecurityUtils;
import com.service.backend.user.dao.UserProfileRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

@Slf4j
@Service
@RequiredArgsConstructor
public class NewsCommentService {

    private final NewsCommentRepository newsCommentRepository;
    private final NewsR2dbcRepository newsRepository;
    private final UserProfileRepository userProfileRepository;

    public Mono<PaginatedResponse<NewsCommentDTO>> findCommentsByNewsId(Integer newsId, int page, int size) {
        long offset = (long) page * size;

        Mono<List<NewsComment>> commentsMono = newsCommentRepository
                .findByNewsIdWithPagination(newsId, size, offset)
                .collectList();

        Mono<Long> countMono = newsCommentRepository.countByNewsId(newsId);

        return PaginationHelper.paginate(commentsMono, countMono, page, size, this::enrichComments)
                .doOnError(error -> log.error("Error finding comments for news ID: {}", newsId, error));
    }

    public Mono<NewsCommentDTO> createComment(CreateNewsCommentRequest request) {
        // Author is taken from the authenticated principal, never from the client body, to prevent
        // impersonation (posting a comment under someone else's id).
        return SecurityUtils.getCurrentUserId()
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.FORBIDDEN)))
                .map(Long::intValue)
                .flatMap(authorMemberId -> newsRepository.findById(request.getNewsId())
                        .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.NEWS_NOT_FOUND)))
                        .flatMap(news -> {
                            NewsComment comment = NewsComment.builder()
                                    .newsId(request.getNewsId())
                                    .authorMemberId(authorMemberId)
                                    .content(request.getContent())
                                    .parentCommentId(request.getParentCommentId())
                                    .isHidden(false)
                                    .build();
                            return newsCommentRepository.save(comment);
                        }))
                .flatMap(this::convertToDTO)
                .doOnError(error -> log.error("Error creating comment for news ID: {}", request.getNewsId(), error));
    }

    public Mono<NewsCommentDTO> replyToComment(Integer commentId, CreateNewsCommentRequest request) {
        request.setParentCommentId(commentId);
        return createComment(request);
    }

    public Mono<NewsCommentDTO> updateComment(Integer id, UpdateNewsCommentRequest request) {
        return newsCommentRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.NEWS_COMMENT_NOT_FOUND)))
                .flatMap(comment -> assertCommentOwnerOrAdmin(comment.getAuthorMemberId())
                        .then(Mono.defer(() -> {
                            comment.setContent(request.getContent());
                            return newsCommentRepository.save(comment);
                        })))
                .flatMap(this::convertToDTO)
                .doOnError(error -> log.error("Error updating news comment ID: {}", id, error));
    }

    @Transactional
    public Mono<Void> deleteComment(Integer id) {
        return newsCommentRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.NEWS_COMMENT_NOT_FOUND)))
                .flatMap(comment -> assertCommentOwnerOrAdmin(comment.getAuthorMemberId())
                        .then(newsCommentRepository.deleteById(id)))
                .doOnError(error -> log.error("Error deleting news comment ID: {}", id, error));
    }

    /**
     * Only the comment's author or an ADMIN may modify/delete it. Prevents IDOR where any
     * authenticated user could edit or delete another user's comment by id.
     */
    private Mono<Void> assertCommentOwnerOrAdmin(Integer authorMemberId) {
        return Mono.zip(
                        SecurityUtils.getCurrentUserId().map(Long::intValue).defaultIfEmpty(-1),
                        SecurityUtils.hasRole("ADMIN"))
                .flatMap(t -> {
                    boolean owner = authorMemberId != null && authorMemberId.equals(t.getT1());
                    boolean admin = Boolean.TRUE.equals(t.getT2());
                    return (owner || admin)
                            ? Mono.empty()
                            : Mono.error(new ApplicationException(ErrorCode.FORBIDDEN, "You can only modify your own comment"));
                });
    }

    private Mono<List<NewsCommentDTO>> enrichComments(List<NewsComment> comments) {
        Set<Integer> authorIds = comments.stream()
                .map(NewsComment::getAuthorMemberId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        return userProfileRepository.findByUserIds(authorIds)
                .map(displayMap -> comments.stream()
                        .map(comment -> {
                            NewsCommentDTO dto = toDTO(comment);
                            UserDisplayInfo info = comment.getAuthorMemberId() != null
                                    ? displayMap.get(comment.getAuthorMemberId())
                                    : null;
                            if (info != null) {
                                dto.setAuthorName(info.getFullName());
                                dto.setAuthorAvatarUrl(info.getAvatarUrl());
                            }
                            return dto;
                        })
                        .collect(Collectors.toList()));
    }

    private Mono<NewsCommentDTO> convertToDTO(NewsComment comment) {
        if (comment.getAuthorMemberId() == null) {
            return Mono.just(toDTO(comment));
        }
        return userProfileRepository.findByUserIds(Set.of(comment.getAuthorMemberId()))
                .map(displayMap -> {
                    NewsCommentDTO dto = toDTO(comment);
                    UserDisplayInfo info = displayMap.get(comment.getAuthorMemberId());
                    if (info != null) {
                        dto.setAuthorName(info.getFullName());
                        dto.setAuthorAvatarUrl(info.getAvatarUrl());
                    }
                    return dto;
                });
    }

    private NewsCommentDTO toDTO(NewsComment comment) {
        return NewsCommentDTO.builder()
                .id(comment.getId())
                .newsId(comment.getNewsId())
                .authorMemberId(comment.getAuthorMemberId())
                .content(comment.getContent())
                .parentCommentId(comment.getParentCommentId())
                .isHidden(comment.getIsHidden())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }
}
