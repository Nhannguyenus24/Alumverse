package com.service.backend.shared.cronjob;

import com.service.backend.event.dao.EventTicketR2dbcRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;
import io.micrometer.core.instrument.MeterRegistry;

/**
 * Job chạy lúc 2h sáng mỗi ngày (giờ Việt Nam) để hết hạn các vé sự kiện chưa check-in
 * của những sự kiện đã kết thúc. Vé đang ở trạng thái ISSUED mà event.end_time đã qua
 * sẽ bị chuyển sang EXPIRED.
 */
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "event.ticket.expiry.enabled", havingValue = "true", matchIfMissing = true)
public class EventTicketExpiryTask {

    private static final Logger log = LoggerFactory.getLogger(EventTicketExpiryTask.class);

    private final EventTicketR2dbcRepository ticketRepo;
    private final MeterRegistry meterRegistry;

    @Scheduled(cron = "${event.ticket.expiry.cron:0 0 2 * * *}", zone = "Asia/Ho_Chi_Minh")
    public void expireIssuedTicketsForEndedEvents() {
        long startTime = System.currentTimeMillis();
        LocalDateTime now = LocalDateTime.now();
        log.info("START: Running event ticket expiry job at {}", now);

        ticketRepo.expireIssuedTicketsForEndedEvents(now)
                .doOnSuccess(count -> {
                    long endTime = System.currentTimeMillis();
                    meterRegistry.timer("cronjob.execution.time", "job_name", "EventTicketExpiry", "status", "success").record(endTime - startTime, TimeUnit.MILLISECONDS);
                    log.info("END (SUCCESS): Event ticket expiry job finished at {}. Expired {} ticket(s). Duration: {} ms", LocalDateTime.now(), count, endTime - startTime);
                })
                .onErrorResume(e -> {
                    long endTime = System.currentTimeMillis();
                    meterRegistry.timer("cronjob.execution.time", "job_name", "EventTicketExpiry", "status", "error").record(endTime - startTime, TimeUnit.MILLISECONDS);
                    log.error("END (ERROR): Error in EventTicketExpiryTask at {}. Duration: {} ms", LocalDateTime.now(), endTime - startTime, e);
                    return Mono.empty();
                })
                .subscribe();
    }
}
