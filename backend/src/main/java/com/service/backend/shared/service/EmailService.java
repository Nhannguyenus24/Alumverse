package com.service.backend.shared.service;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Service
public class EmailService {
    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${app.mail.from-address}")
    private String fromAddress;

    @Value("${app.mail.from-name}")
    private String fromName;

    private EmailService(JavaMailSender mailSender, TemplateEngine templateEngine) {
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
    }
    /**
     * Gửi email HTML với template (Reactive)
     */
    public Mono<Void> sendHtmlEmail(String to, String subject, String templateName, Map<String, Object> variables) {
        return Mono.fromCallable(() -> {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress, fromName);
            helper.setTo(to);
            helper.setSubject(subject);

            Context context = new Context();
            context.setVariables(variables);

            // Process template
            String htmlContent = templateEngine.process(templateName, context);
            helper.setText(htmlContent, true);

            return message;
        })
        .flatMap(message -> Mono.fromRunnable(() -> mailSender.send(message))
            .subscribeOn(Schedulers.boundedElastic()))
        .doOnSuccess(v -> log.info("Email sent successfully to: {} with subject: {}", to, subject))
        .doOnError(e -> log.error("Failed to send email to: {}. Error: {}", to, e.getMessage(), e))
        .onErrorMap(MessagingException.class, e -> new RuntimeException("Failed to send email", e))
        .then();
    }
}
