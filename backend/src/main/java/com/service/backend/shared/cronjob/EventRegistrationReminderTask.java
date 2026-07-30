package com.service.backend.shared.cronjob;

import com.service.backend.event.dao.EventInterestR2dbcRepository;
import com.service.backend.event.dao.EventTicketR2dbcRepository;
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
import java.util.concurrent.TimeUnit;
import io.micrometer.core.instrument.MeterRegistry;

/**
 * Job chạy 1 lần/ngày cho các sự kiện có registration_end_at trong vòng 24h tới:
 *  - Nhắc các thành viên đã "quan tâm" nhưng CHƯA đăng ký -> nhắc đăng ký kẻo hết hạn.
 *  - Nhắc riêng các thành viên ĐÃ đăng ký (ticket còn hiệu lực) rằng sự kiện sắp diễn ra.
 * Thành viên vừa quan tâm vừa đã đăng ký chỉ nhận noti "đã đăng ký" (đã được filter ở query).
 */
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "event.registration.reminder.enabled", havingValue = "true", matchIfMissing = true)
public class EventRegistrationReminderTask {

    private static final Logger log = LoggerFactory.getLogger(EventRegistrationReminderTask.class);

    private final EventInterestR2dbcRepository interestRepo;
    private final EventTicketR2dbcRepository ticketRepo;
    private final SseService sseService;
    private final NotificationService notificationService;
    private final MeterRegistry meterRegistry;

    @Scheduled(cron = "${event.registration.reminder.cron:0 0 8 * * *}", zone = "Asia/Ho_Chi_Minh")
    public void notifyUpcomingRegistrationDeadlines() {
        long startTime = System.currentTimeMillis();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime windowEnd = now.plusDays(1);
        log.info("START: Running event registration reminder job at {} (windowEnd={})", now, windowEnd);

        Mono<Long> interestCount = interestRepo.findPendingRegistrationReminders(now, windowEnd)
                .doOnNext(this::notifyInterestedMember)
                .concatMap(r -> interestRepo.markReminderSent(r.getInterestId()).thenReturn(r))
                .count();

        Mono<Long> registeredCount = ticketRepo.findRegisteredMembersForUpcomingDeadline(now, windowEnd)
                .doOnNext(this::notifyRegisteredMember)
                .count();

        Mono.zip(interestCount, registeredCount)
                .doOnSuccess(counts -> {
                    long endTime = System.currentTimeMillis();
                    meterRegistry.timer("cronjob.execution.time", "job_name", "EventRegistrationReminder", "status", "success").record(endTime - startTime, TimeUnit.MILLISECONDS);
                    log.info("END (SUCCESS): Event registration reminder job finished at {}. Notified {} interested + {} registered member(s). Duration: {} ms",
                            LocalDateTime.now(), counts.getT1(), counts.getT2(), endTime - startTime);
                })
                .onErrorResume(e -> {
                    long endTime = System.currentTimeMillis();
                    meterRegistry.timer("cronjob.execution.time", "job_name", "EventRegistrationReminder", "status", "error").record(endTime - startTime, TimeUnit.MILLISECONDS);
                    log.error("END (ERROR): Error in EventRegistrationReminderTask at {}. Duration: {} ms", LocalDateTime.now(), endTime - startTime, e);
                    return Mono.empty();
                })
                .subscribe();
    }

    private void notifyInterestedMember(EventInterestR2dbcRepository.EventReminderProjection r) {
        String message = "Sự kiện \"" + r.getEventTitle() + "\" sắp hết hạn đăng ký.";
        notificationService.createNotificationAsync(
                r.getMemberId().intValue(),
                "Sắp hết hạn đăng ký sự kiện",
                message,
                "/article/event/" + r.getEventId());
        sseService.sendToUser(r.getMemberId(), "event-reminder",
                Map.of("eventId", r.getEventId(), "eventTitle", r.getEventTitle(), "message", message));
    }

    private void notifyRegisteredMember(EventTicketR2dbcRepository.RegisteredMemberReminderProjection r) {
        String message = "Bạn đã đăng ký sự kiện \"" + r.getEventTitle() + "\". Đừng quên tham gia nhé!";
        notificationService.createNotificationAsync(
                r.getMemberId().intValue(),
                "Nhắc nhở sự kiện đã đăng ký",
                message,
                "/article/event/" + r.getEventId());
        sseService.sendToUser(r.getMemberId(), "event-registered-reminder",
                Map.of("eventId", r.getEventId(), "eventTitle", r.getEventTitle(), "message", message));
    }
}
