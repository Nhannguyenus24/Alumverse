package com.service.backend.mentorship.service;

import com.service.backend.mentorship.dao.MentorAvailabilityR2dbcRepository;
import com.service.backend.mentorship.dao.MentorProfileR2dbcRepository;
import com.service.backend.mentorship.dao.MentorshipSessionR2dbcRepository;
import com.service.backend.mentorship.dao.SessionWindowProjection;
import com.service.backend.mentorship.dto.JoinSessionResponse;
import com.service.backend.shared.entity.MentorshipSession;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.enums.Status;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.utils.SecurityUtils;
import com.service.backend.user.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class MentorshipSessionService {

    private final MentorshipSessionR2dbcRepository sessionRepository;
    private final MentorAvailabilityR2dbcRepository availabilityRepository;
    private final MentorProfileR2dbcRepository profileRepository;
    private final NotificationService notificationService;

    @Value("${mentorship.join.early-minutes:15}")
    private long earlyMinutes;

    private Mono<Integer> currentMemberId() {
        return SecurityUtils.getCurrentUserId().map(Long::intValue);
    }

    @Transactional
    public Mono<JoinSessionResponse> joinSession(Integer sessionId, boolean isMentor) {
        return currentMemberId().flatMap(memberId ->
                sessionRepository.findById(sessionId)
                        .switchIfEmpty(Mono.error(new ApplicationException(
                                ErrorCode.SESSION_NOT_FOUND, "Không tìm thấy buổi mentoring")))
                        .zipWhen(session -> sessionRepository.findWindowBySessionId(sessionId)
                                .switchIfEmpty(Mono.error(new ApplicationException(
                                        ErrorCode.AVAILABILITY_NOT_FOUND, "Không tìm thấy khung giờ của buổi mentoring"))))
                        .flatMap(t -> {
                            MentorshipSession session = t.getT1();
                            SessionWindowProjection window = t.getT2();
                            LocalDateTime now = LocalDateTime.now();

                            boolean authorized = isMentor
                                    ? memberId.equals(window.getMentorMemberId())
                                    : memberId.equals(session.getMenteeMemberId());
                            if (!authorized) {
                                return Mono.error(new ApplicationException(
                                        ErrorCode.FORBIDDEN, "Bạn không có quyền tham gia buổi mentoring này"));
                            }

                            if (session.getStatus() != Status.CONFIRMED && session.getStatus() != Status.IN_PROGRESS) {
                                return Mono.error(new ApplicationException(ErrorCode.SESSION_NOT_JOINABLE));
                            }

                            if (now.isBefore(window.getStartTime().minusMinutes(earlyMinutes))) {
                                return Mono.error(new ApplicationException(ErrorCode.JOIN_TOO_EARLY));
                            }
                            if (now.isAfter(window.getEndTime())) {
                                return Mono.error(new ApplicationException(ErrorCode.JOIN_WINDOW_CLOSED));
                            }

                            return resolveMeetingLink(session, window.getMentorMemberId())
                                    .flatMap(link -> {
                                        return sessionRepository.markJoined(sessionId, Status.IN_PROGRESS.getValue(), isMentor, now)
                                                .doOnSuccess(ignored -> notifyOtherParty(session, window, isMentor))
                                                .thenReturn(JoinSessionResponse.builder()
                                                        .sessionId(sessionId)
                                                        .status(Status.IN_PROGRESS.getValue())
                                                        .meetingLink(link)
                                                        .joinedAt(now)
                                                        .build());
                                    });
                        }));
    }

    private Mono<String> resolveMeetingLink(MentorshipSession session, Integer mentorMemberId) {
        if (session.getMeetingLink() != null && !session.getMeetingLink().isBlank()) {
            return Mono.just(session.getMeetingLink());
        }
        return profileRepository.findById(mentorMemberId)
                .map(profile -> profile.getDefaultMeetingLink())
                .filter(link -> link != null && !link.isBlank())
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.MEETING_LINK_NOT_CONFIGURED)));
    }

    private void notifyOtherParty(MentorshipSession session, SessionWindowProjection window, boolean joinerIsMentor) {
        if (session.getStatus() == Status.IN_PROGRESS) {
            return;
        }
        Integer recipientId = joinerIsMentor ? session.getMenteeMemberId() : window.getMentorMemberId();
        String message = joinerIsMentor
                ? "Cố vấn đã vào phòng họp. Hãy tham gia buổi mentoring ngay."
                : "Người được cố vấn đã vào phòng họp. Hãy tham gia buổi mentoring ngay.";
        String link = joinerIsMentor
                ? "/development/mentorship/my-bookings"
                : "/development/mentorship/dashboard";
        notificationService.createNotificationAsync(recipientId, "Buổi mentoring đã bắt đầu", message, link);
    }
}
