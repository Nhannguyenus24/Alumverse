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
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;
import io.micrometer.core.instrument.MeterRegistry;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "mentorship.session.status.enabled", havingValue = "true", matchIfMissing = true)
public class MentorshipSessionStatusTask {

    private static final Logger log = LoggerFactory.getLogger(MentorshipSessionStatusTask.class);

    private final MentorshipSessionR2dbcRepository sessionRepository;
    private final MentorAvailabilityR2dbcRepository availabilityRepository;
    private final MentorProfileR2dbcRepository profileRepository;
    private final NotificationService notificationService;
    private final MeterRegistry meterRegistry;

    @Value("${mentorship.meeting-link.reminder-minutes:180}")
    private long meetingLinkReminderMinutes;

    @Scheduled(cron = "${mentorship.session.status.cron:0 */15 * * * *}")
    public void autoTransition() {
        long startTime = System.currentTimeMillis();
        LocalDateTime now = LocalDateTime.now();
        log.info("START: MentorshipSessionStatusTask autoTransition at {}", now);

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
                .doOnComplete(() -> {
                    long endTime = System.currentTimeMillis();
                    meterRegistry.timer("cronjob.execution.time", "job_name", "MentorshipSessionStatus_Close", "status", "success").record(endTime - startTime, TimeUnit.MILLISECONDS);
                    log.info("END (SUCCESS): MentorshipSessionStatusTask (auto-close sessions) finished at {}. Duration: {} ms", LocalDateTime.now(), endTime - startTime);
                })
                .doOnError(e -> {
                    long endTime = System.currentTimeMillis();
                    meterRegistry.timer("cronjob.execution.time", "job_name", "MentorshipSessionStatus_Close", "status", "error").record(endTime - startTime, TimeUnit.MILLISECONDS);
                    log.error("END (ERROR): Error in MentorshipSessionStatusTask (auto-close sessions) at {}. Duration: {} ms", LocalDateTime.now(), endTime - startTime, e);
                })
                .subscribe();

        availabilityRepository.expireStaleAvailabilities(now)
                .doOnSuccess(ignored -> {
                    long endTime = System.currentTimeMillis();
                    meterRegistry.timer("cronjob.execution.time", "job_name", "MentorshipSessionStatus_ExpireAvail", "status", "success").record(endTime - startTime, TimeUnit.MILLISECONDS);
                    log.info("END (SUCCESS): MentorshipSessionStatusTask (expire availabilities) finished at {}. Duration: {} ms", LocalDateTime.now(), endTime - startTime);
                })
                .doOnError(e -> {
                    long endTime = System.currentTimeMillis();
                    meterRegistry.timer("cronjob.execution.time", "job_name", "MentorshipSessionStatus_ExpireAvail", "status", "error").record(endTime - startTime, TimeUnit.MILLISECONDS);
                    log.error("END (ERROR): Failed to expire stale availabilities at {}. Duration: {} ms", LocalDateTime.now(), endTime - startTime, e);
                })
                .subscribe();

        remindMissingMeetingLinks(now, startTime);
    }

    private void remindMissingMeetingLinks(LocalDateTime now, long startTime) {
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
                .doOnComplete(() -> {
                    long endTime = System.currentTimeMillis();
                    meterRegistry.timer("cronjob.execution.time", "job_name", "MentorshipSessionStatus_RemindLinks", "status", "success").record(endTime - startTime, TimeUnit.MILLISECONDS);
                    log.info("END (SUCCESS): MentorshipSessionStatusTask (remind missing links) finished at {}. Duration: {} ms", LocalDateTime.now(), endTime - startTime);
                })
                .doOnError(e -> {
                    long endTime = System.currentTimeMillis();
                    meterRegistry.timer("cronjob.execution.time", "job_name", "MentorshipSessionStatus_RemindLinks", "status", "error").record(endTime - startTime, TimeUnit.MILLISECONDS);
                    log.error("END (ERROR): Error reminding missing meeting links at {}. Duration: {} ms", LocalDateTime.now(), endTime - startTime, e);
                })
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
