package com.service.backend.shared.cronjob;

import com.service.backend.event.dao.EventInterestR2dbcRepository;
import com.service.backend.shared.service.SseService;
import com.service.backend.user.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Job chạy 1 lần/ngày, thông báo (SSE + notification) cho các thành viên đã "quan tâm"
 * một sự kiện khi registration_end_at của sự kiện đó còn trong vòng 24h tới.
 */
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "event.registration.reminder.enabled", havingValue = "true", matchIfMissing = true)
public class EventRegistrationReminderTask {

    private static final Logger log = LoggerFactory.getLogger(EventRegistrationReminderTask.class);

    private final EventInterestR2dbcRepository interestRepo;
    private final SseService sseService;
    private final NotificationService notificationService;

    @Scheduled(cron = "${event.registration.reminder.cron:0 0 8 * * *}", zone = "Asia/Ho_Chi_Minh")
    public void notifyUpcomingRegistrationDeadlines() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime windowEnd = now.plusDays(1);
        log.info("Running event registration reminder job (now={}, windowEnd={})", now, windowEnd);

        interestRepo.findPendingRegistrationReminders(now, windowEnd)
                .doOnNext(r -> {
                    String message = "Sự kiện \"" + r.getEventTitle() + "\" sắp hết hạn đăng ký.";
                    notificationService.createNotificationAsync(
                            r.getMemberId().intValue(),
                            "Sắp hết hạn đăng ký sự kiện",
                            message,
                            "/article/event/" + r.getEventId());
                    sseService.sendToUser(r.getMemberId(), "event-reminder",
                            Map.of("eventId", r.getEventId(), "eventTitle", r.getEventTitle(), "message", message));
                })
                .concatMap(r -> interestRepo.markReminderSent(r.getInterestId()))
                .count()
                .doOnSuccess(count -> log.info("Event registration reminder job notified {} interest(s)", count))
                .onErrorResume(e -> {
                    log.error("Error in EventRegistrationReminderTask", e);
                    return Mono.empty();
                })
                .subscribe();
    }
}
