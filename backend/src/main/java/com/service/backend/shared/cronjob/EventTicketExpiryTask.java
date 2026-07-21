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

    @Scheduled(cron = "${event.ticket.expiry.cron:0 0 2 * * *}", zone = "Asia/Ho_Chi_Minh")
    public void expireIssuedTicketsForEndedEvents() {
        LocalDateTime now = LocalDateTime.now();
        log.info("Running event ticket expiry job (now={})", now);

        ticketRepo.expireIssuedTicketsForEndedEvents(now)
                .doOnSuccess(count -> log.info("Event ticket expiry job expired {} ticket(s)", count))
                .onErrorResume(e -> {
                    log.error("Error in EventTicketExpiryTask", e);
                    return Mono.empty();
                })
                .subscribe();
    }
}
