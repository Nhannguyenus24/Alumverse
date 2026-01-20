package com.service.backend.shared.mail.impl;

import com.service.backend.shared.mail.EmailService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Service
@RequiredArgsConstructor
public class SmtpEmailService implements EmailService {

    private static final Logger logger = LoggerFactory.getLogger(SmtpEmailService.class);

    private final JavaMailSender mailSender;

    @Value("${frontend.base-url:http://localhost:3000}")
    private String frontendBaseUrl;

    @Override
    public Mono<Void> sendVerificationEmail(String to, String otpCode, Long userId) {
        String verificationLink = String.format("%s/verify-email?otp=%s&email=%s&userId=%d",
                frontendBaseUrl, otpCode, to, userId);

        String subject = "Verify Your Email Address";
        String content = String.format(
                "Welcome! Please verify your email address by clicking the link below:\n\n" +
                "%s\n\n" +
                "Or use this verification code: %s\n\n" +
                "This link will expire in 15 minutes.\n\n" +
                "If you did not create an account, please ignore this email.",
                verificationLink, otpCode
        );
        return sendPlainText(to, subject, content);
    }

    @Override
    public Mono<Void> sendPlainText(String to, String subject, String content) {
        return Mono.fromRunnable(() -> {
                    try {
                        SimpleMailMessage message = new SimpleMailMessage();
                        message.setTo(to);
                        message.setSubject(subject);
                        message.setText(content);
                        // Spring Mail will automatically use spring.mail.username as "from" address
                        mailSender.send(message);
                        logger.info("Email sent successfully to: {}", to);
                    } catch (Exception e) {
                        logger.error("Failed to send email to: {}", to, e);
                        throw new RuntimeException("Failed to send email", e);
                    }
                })
                // JavaMailSender is blocking I/O -> move off event loop
                .subscribeOn(Schedulers.boundedElastic())
                .then();
    }
}

