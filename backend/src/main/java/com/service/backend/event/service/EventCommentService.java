package com.service.backend.event.service;

import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.service.backend.event.dao.EventCommentRepository;
import com.service.backend.event.dao.EventR2dbcRepository;
import com.service.backend.event.dto.CreateEventCommentRequest;
import com.service.backend.event.dto.EventCommentDTO;
import com.service.backend.event.dto.UpdateEventCommentRequest;
import com.service.backend.shared.dao.UserDisplayInfo;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.entity.EventComment;
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
public class EventCommentService {

    private final EventCommentRepository eventCommentRepository;
    private final EventR2dbcRepository eventRepository;
    private final UserProfileRepository userProfileRepository;

    public Mono<PaginatedResponse<EventCommentDTO>> findCommentsByEventId(Long eventId, int page, int size) {
        long offset = (long) page * size;

        Mono<List<EventComment>> commentsMono = eventCommentRepository
                .findByEventIdWithPagination(eventId, size, offset)
                .collectList();

        Mono<Long> countMono = eventCommentRepository.countByEventId(eventId);

        return PaginationHelper.paginate(commentsMono, countMono, page, size, this::enrichComments)
                .doOnError(error -> log.error("Error finding comments for event ID: {}", eventId, error));
    }

    public Mono<EventCommentDTO> createComment(CreateEventCommentRequest request) {
        // Author is taken from the authenticated principal, never from the client body, to prevent
        // impersonation (posting a comment under someone else's id).
        return SecurityUtils.getCurrentUserId()
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.FORBIDDEN)))
                .map(Long::intValue)
                .flatMap(authorMemberId -> eventRepository.findById(request.getEventId())
                        .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_NOT_FOUND)))
                        .flatMap(event -> {
                            EventComment comment = EventComment.builder()
                                    .eventId(request.getEventId())
                                    .authorMemberId(authorMemberId)
                                    .content(request.getContent())
                                    .parentCommentId(request.getParentCommentId())
                                    .isHidden(false)
                                    .build();
                            return eventCommentRepository.save(comment);
                        }))
                .flatMap(this::convertToDTO)
                .doOnError(error -> log.error("Error creating comment for event ID: {}", request.getEventId(), error));
    }

    public Mono<EventCommentDTO> replyToComment(Integer commentId, CreateEventCommentRequest request) {
        request.setParentCommentId(commentId);
        return createComment(request);
    }

    public Mono<EventCommentDTO> updateComment(Integer id, UpdateEventCommentRequest request) {
        return eventCommentRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_COMMENT_NOT_FOUND)))
                .flatMap(comment -> assertCommentOwnerOrAdmin(comment.getAuthorMemberId())
                        .then(Mono.defer(() -> {
                            comment.setContent(request.getContent());
                            return eventCommentRepository.save(comment);
                        })))
                .flatMap(this::convertToDTO)
                .doOnError(error -> log.error("Error updating event comment ID: {}", id, error));
    }

    @Transactional
    public Mono<Void> deleteComment(Integer id) {
        return eventCommentRepository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.EVENT_COMMENT_NOT_FOUND)))
                .flatMap(comment -> assertCommentOwnerOrAdmin(comment.getAuthorMemberId())
                        .then(eventCommentRepository.deleteById(id)))
                .doOnError(error -> log.error("Error deleting event comment ID: {}", id, error));
    }

    /**
     * Only the comment's author or an ADMIN may modify/delete it (prevents IDOR).
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

    private Mono<List<EventCommentDTO>> enrichComments(List<EventComment> comments) {
        Set<Integer> authorIds = comments.stream()
                .map(EventComment::getAuthorMemberId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        return userProfileRepository.findByUserIds(authorIds)
                .map(displayMap -> comments.stream()
                        .map(comment -> {
                            EventCommentDTO dto = toDTO(comment);
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

    private Mono<EventCommentDTO> convertToDTO(EventComment comment) {
        if (comment.getAuthorMemberId() == null) {
            return Mono.just(toDTO(comment));
        }
        return userProfileRepository.findByUserIds(Set.of(comment.getAuthorMemberId()))
                .map(displayMap -> {
                    EventCommentDTO dto = toDTO(comment);
                    UserDisplayInfo info = displayMap.get(comment.getAuthorMemberId());
                    if (info != null) {
                        dto.setAuthorName(info.getFullName());
                        dto.setAuthorAvatarUrl(info.getAvatarUrl());
                    }
                    return dto;
                });
    }

    private EventCommentDTO toDTO(EventComment comment) {
        return EventCommentDTO.builder()
                .id(comment.getId())
                .eventId(comment.getEventId())
                .authorMemberId(comment.getAuthorMemberId())
                .content(comment.getContent())
                .parentCommentId(comment.getParentCommentId())
                .isHidden(comment.getIsHidden())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }
}
