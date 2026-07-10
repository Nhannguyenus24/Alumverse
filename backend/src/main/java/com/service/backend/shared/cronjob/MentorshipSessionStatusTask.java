package com.service.backend.shared.cronjob;

import com.service.backend.mentorship.dao.MentorAvailabilityR2dbcRepository;
import com.service.backend.mentorship.dao.MentorProfileR2dbcRepository;
import com.service.backend.mentorship.dao.MentorshipSessionR2dbcRepository;
import com.service.backend.shared.entity.MentorshipSession;
import com.service.backend.shared.enums.Status;
import com.service.backend.user.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class MentorshipSessionStatusTask {

    private static final Logger log = LoggerFactory.getLogger(MentorshipSessionStatusTask.class);

    private final MentorshipSessionR2dbcRepository sessionRepository;
    private final MentorAvailabilityR2dbcRepository availabilityRepository;
    private final MentorProfileR2dbcRepository profileRepository;
    private final NotificationService notificationService;

    @Value("${mentorship.meeting-link.reminder-minutes:180}")
    private long meetingLinkReminderMinutes;

    @Scheduled(cron = "${mentorship.session.status.cron:0 */15 * * * *}")
    public void autoTransition() {
        LocalDateTime now = LocalDateTime.now();

        sessionRepository.findEndedCandidates(now)
                .flatMap(session -> {
                    boolean attended = session.getStartedAt() != null;
                    String newStatus = attended ? Status.COMPLETED.getValue() : Status.EXPIRED.getValue();
                    Mono<?> totalSessionsUpdate = attended
                            ? sessionRepository.findWindowBySessionId(session.getId())
                                    .flatMap(window -> profileRepository.incrementTotalSessions(window.getMentorMemberId()))
                            : Mono.empty();
                    return sessionRepository.closeSession(session.getId(), newStatus, now)
                            .then(totalSessionsUpdate)
                            .doOnSuccess(ignored -> notifySessionClosed(session, attended))
                            .onErrorResume(e -> {
                                log.error("Failed to auto-close mentorship session {}", session.getId(), e);
                                return Mono.empty();
                            });
                }, 8)
                .doOnError(e -> log.error("Error in MentorshipSessionStatusTask", e))
                .subscribe();

        availabilityRepository.expireStaleAvailabilities(now)
                .doOnError(e -> log.error("Failed to expire stale availabilities", e))
                .subscribe();

        remindMissingMeetingLinks(now);
    }

    private void remindMissingMeetingLinks(LocalDateTime now) {
        LocalDateTime until = now.plusMinutes(meetingLinkReminderMinutes);
        sessionRepository.findMissingMeetingLinkCandidates(now, until)
                .flatMap(candidate ->
                        sessionRepository.markMeetingLinkReminded(candidate.getSessionId(), now)
                                .doOnSuccess(ignored -> notificationService.createNotificationAsync(
                                        candidate.getMentorMemberId(),
                                        "Hãy thêm link tham gia buổi mentoring",
                                        "Một buổi cố vấn của bạn sắp diễn ra nhưng chưa có link tham gia. "
                                                + "Vui lòng thêm link họp cho buổi này trước khi bắt đầu.",
                                        "/mentorship/my-bookings"))
                                .onErrorResume(e -> {
                                    log.error("Failed to remind missing meeting link for session {}",
                                            candidate.getSessionId(), e);
                                    return Mono.empty();
                                }), 8)
                .doOnError(e -> log.error("Error reminding missing meeting links", e))
                .subscribe();
    }

    private void notifySessionClosed(MentorshipSession session, boolean attended) {
        if (attended) {
            notificationService.createNotificationAsync(
                    session.getMenteeMemberId(),
                    "Buổi cố vấn đã hoàn tất",
                    "Buổi cố vấn của bạn đã kết thúc. Hãy dành chút thời gian để lại đánh giá cho cố vấn nhé!",
                    "/mentorship/my-bookings");
        } else {
            notificationService.createNotificationAsync(
                    session.getMenteeMemberId(),
                    "Buổi cố vấn đã quá hạn",
                    "Buổi cố vấn đã qua giờ mà không có ai tham gia. Bạn có thể đặt lại lịch hoặc báo cáo sự cố.",
                    "/mentorship/my-bookings");
        }
    }
}
