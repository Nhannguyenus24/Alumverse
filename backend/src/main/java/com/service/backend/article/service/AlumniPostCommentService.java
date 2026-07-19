package com.service.backend.article.service;

import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.service.backend.article.dao.AlumniPostCommentRepository;
import com.service.backend.article.dao.AlumniPostR2dbcRepository;
import com.service.backend.article.dto.AlumniPostCommentDTO;
import com.service.backend.article.dto.CreateAlumniPostCommentRequest;
import com.service.backend.article.dto.UpdateAlumniPostCommentRequest;
import com.service.backend.shared.dao.UserDisplayInfo;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.entity.AlumniPostComment;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.utils.PaginationHelper;
import com.service.backend.user.dao.UserProfileRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

@Slf4j
@Service
@RequiredArgsConstructor
public class AlumniPostCommentService {

    private final AlumniPostCommentRepository alumniPostCommentRepository;
    private final AlumniPostR2dbcRepository alumniPostRepository;
    private final UserProfileRepository userProfileRepository;

    public Mono<PaginatedResponse<AlumniPostCommentDTO>> findCommentsByAlumniPostId(Integer alumniPostId, int page, int size) {
        long offset = (long) page * size;

        Mono<List<AlumniPostComment>> commentsMono = alumniPostCommentRepository
                .findByAlumniPostIdWithPagination(alumniPostId, size, offset)
                .collectList();

        Mono<Long> countMono = alumniPostCommentRepository.countByAlumniPostId(alumniPostId);

        return PaginationHelper.paginate(commentsMono, countMono, page, size, this::enrichComments)
                .doOnError(error -> log.error("Error finding comments for alumni post ID: {}", alumniPostId, error));
    }

    public Mono<AlumniPostCommentDTO> createComment(CreateAlumniPostCommentRequest request) {
        return alumniPostRepository.findById(request.getAlumniPostId())
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.ALUMNI_POST_NOT_FOUND)))
                .flatMap(post -> {
                    AlumniPostComment comment = AlumniPostComment.builder()
                            .alumniPostId(request.getAlumniPostId())
                            .authorMemberId(request.getAuthorMemberId())
                            .content(request.getContent())
                            .parentCommentId(request.getParentCommentId())
                            .isHidden(false)
                            .build();
                    return alumniPostCommentRepository.save(comment);
                })
                .flatMap(this::convertToDTO)
                .doOnError(error -> log.error("Error creating comment for alumni post ID: {}", request.getAlumniPostId(), error));
    }

    public Mono<AlumniPostCommentDTO> replyToComment(Integer commentId, CreateAlumniPostCommentRequest request) {
        request.setParentCommentId(commentId);
        return createComment(request);
    }

    public Mono<AlumniPostCommentDTO> updateComment(Integer id, UpdateAlumniPostCommentRequest request) {
        return alumniPostCommentRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.ALUMNI_POST_COMMENT_NOT_FOUND)))
                .flatMap(comment -> {
                    comment.setContent(request.getContent());
                    return alumniPostCommentRepository.save(comment);
                })
                .flatMap(this::convertToDTO)
                .doOnError(error -> log.error("Error updating alumni post comment ID: {}", id, error));
    }

    @Transactional
    public Mono<Void> deleteComment(Integer id) {
        return alumniPostCommentRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.ALUMNI_POST_COMMENT_NOT_FOUND)))
                .flatMap(comment -> alumniPostCommentRepository.deleteById(id))
                .doOnError(error -> log.error("Error deleting alumni post comment ID: {}", id, error));
    }

    private Mono<List<AlumniPostCommentDTO>> enrichComments(List<AlumniPostComment> comments) {
        Set<Integer> authorIds = comments.stream()
                .map(AlumniPostComment::getAuthorMemberId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        return userProfileRepository.findByUserIds(authorIds)
                .map(displayMap -> comments.stream()
                        .map(comment -> {
                            AlumniPostCommentDTO dto = toDTO(comment);
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

    private Mono<AlumniPostCommentDTO> convertToDTO(AlumniPostComment comment) {
        if (comment.getAuthorMemberId() == null) {
            return Mono.just(toDTO(comment));
        }
        return userProfileRepository.findByUserIds(Set.of(comment.getAuthorMemberId()))
                .map(displayMap -> {
                    AlumniPostCommentDTO dto = toDTO(comment);
                    UserDisplayInfo info = displayMap.get(comment.getAuthorMemberId());
                    if (info != null) {
                        dto.setAuthorName(info.getFullName());
                        dto.setAuthorAvatarUrl(info.getAvatarUrl());
                    }
                    return dto;
                });
    }

    private AlumniPostCommentDTO toDTO(AlumniPostComment comment) {
        return AlumniPostCommentDTO.builder()
                .id(comment.getId())
                .alumniPostId(comment.getAlumniPostId())
                .authorMemberId(comment.getAuthorMemberId())
                .content(comment.getContent())
                .parentCommentId(comment.getParentCommentId())
                .isHidden(comment.getIsHidden())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }
}
