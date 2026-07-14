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

/**
 * Job chạy lúc 2h30 sáng mỗi ngày để dọn dẹp các tài khoản alumni đang "đang xác thực".
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

    @Value("${alumni.verification.expiry-days:3}")
    private long expiryDays;

    @Scheduled(cron = "${alumni.verification.expiry.cron:0 30 2 * * *}")
    public void expireStaleVerifyingMembers() {
        LocalDateTime threshold = LocalDateTime.now().minusDays(expiryDays);
        log.info("Running alumni verification expiry job (threshold before {})", threshold);

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
                .doOnSuccess(count -> log.info("Alumni verification expiry job reset {} member(s) to level 0", count))
                .onErrorResume(e -> {
                    log.error("Error in AlumniVerificationExpiryTask", e);
                    return Mono.empty();
                })
                .subscribe();
    }
}
