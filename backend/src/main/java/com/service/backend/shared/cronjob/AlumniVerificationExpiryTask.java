package com.service.backend.shared.cronjob;

import com.service.backend.user.dao.UserOrganizationMemberRepository;
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

/**
 * Job chạy lúc 4h sáng mỗi ngày để dọn dẹp các tài khoản alumni đang "đang xác thực".
 *
 * <p>Khi một thành viên gửi yêu cầu xác thực (verification request) hoặc yêu cầu xác thực
 * đồng nghiệp (peer verify), verification_level của họ được đặt thành 1 (đang xác thực).
 * Nếu quá {@code alumni.verification.expiry-days} ngày mà yêu cầu vẫn chưa được xử lý
 * (không còn yêu cầu PENDING nào trong khoảng thời gian đó), job sẽ hạ verification_level
 * của họ về 0 để họ có thể gửi lại yêu cầu xác thực.</p>
 */
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "alumni.verification.expiry.enabled", havingValue = "true", matchIfMissing = true)
public class AlumniVerificationExpiryTask {

    private static final Logger log = LoggerFactory.getLogger(AlumniVerificationExpiryTask.class);

    private final UserOrganizationMemberRepository memberRepository;
    private final NotificationService notificationService;
    private final MeterRegistry meterRegistry;

    @Value("${alumni.verification.expiry-days:3}")
    private long expiryDays;

    @Scheduled(cron = "${alumni.verification.expiry.cron:0 0 4 * * *}")
    public void expireStaleVerifyingMembers() {
        long startTime = System.currentTimeMillis();
        LocalDateTime threshold = LocalDateTime.now().minusDays(expiryDays);
        log.info("START: Running alumni verification expiry job at {} (threshold before {})", LocalDateTime.now(), threshold);

        memberRepository.expireStaleVerifyingMembers(threshold)
                .flatMap(expired -> Mono.zip(
                        memberRepository.expireAllUserVerificationRequests(expired.organizationId(), expired.userId()),
                        memberRepository.expireAllUserPeerVerifications(expired.organizationId(), expired.userId())
                ).thenReturn(expired))
                .doOnNext(expired -> notificationService.createNotificationAsync(
                        expired.userId(),
                        "Yêu cầu xác thực đã hết hạn",
                        "Yêu cầu xác thực của bạn đã quá " + expiryDays
                                + " ngày mà chưa được xử lý. Bạn có thể gửi lại yêu cầu xác thực.",
                        "/settings?tab=verification"))
                .count()
                .doOnSuccess(count -> {
                    long endTime = System.currentTimeMillis();
                    meterRegistry.timer("cronjob.execution.time", "job_name", "AlumniVerificationExpiry", "status", "success").record(endTime - startTime, TimeUnit.MILLISECONDS);
                    log.info("END (SUCCESS): Alumni verification expiry job finished at {}. Reset {} member(s) to level 0. Duration: {} ms", LocalDateTime.now(), count, endTime - startTime);
                })
                .onErrorResume(e -> {
                    long endTime = System.currentTimeMillis();
                    meterRegistry.timer("cronjob.execution.time", "job_name", "AlumniVerificationExpiry", "status", "error").record(endTime - startTime, TimeUnit.MILLISECONDS);
                    log.error("END (ERROR): Error in AlumniVerificationExpiryTask at {}. Duration: {} ms", LocalDateTime.now(), endTime - startTime, e);
                    return Mono.empty();
                })
                .subscribe();
    }
}
