package com.service.backend.shared.mail;

import reactor.core.publisher.Mono;

public interface EmailService {
    Mono<Void> sendVerificationEmail(String to, String otpCode, Long userId);

    Mono<Void> sendPlainText(String to, String subject, String content);
}

