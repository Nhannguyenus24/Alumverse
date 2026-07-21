package com.service.backend.shared.service;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import com.service.backend.shared.dao.EmailTemplateR2dbcRepository;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import reactor.core.publisher.Mono;
import reactor.core.publisher.SignalType;
import reactor.core.scheduler.Schedulers;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;

@Service
public class EmailService {
    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    private final MeterRegistry meterRegistry;
    private final EmailTemplateR2dbcRepository emailTemplateRepository;

    @Value("${app.mail.from-address}")
    private String fromAddress;

    @Value("${app.mail.from-name}")
    private String fromName;

    public EmailService(JavaMailSender mailSender, @Qualifier("emailTemplateEngine") TemplateEngine templateEngine, MeterRegistry meterRegistry,
                        EmailTemplateR2dbcRepository emailTemplateRepository) {
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
        this.meterRegistry = meterRegistry;
        this.emailTemplateRepository = emailTemplateRepository;
    }

    public Mono<Void> sendHtmlEmail(String to, String subject, String templateName, Map<String, Object> variables) {
        return resolveTemplate(templateName, subject)
                .flatMap(resolved -> dispatch(to, resolved.subject(), templateName, resolved.templateOrContent(), variables));
    }

    public Mono<Void> sendRawHtmlEmail(String to, String subject, String htmlContent, Map<String, Object> variables) {
        return dispatch(to, subject, "raw", htmlContent, variables);
    }

    public Mono<Void> sendHtmlEmailWithInlineImage(
            String to,
            String subject,
            String templateName,
            Map<String, Object> variables,
            String contentId,
            byte[] imageBytes,
            String imageMimeType
    ) {
        return resolveTemplate(templateName, subject)
            .flatMap(resolved -> dispatch(to, resolved.subject(), templateName, resolved.templateOrContent(), variables,
                helper -> helper.addInline(contentId, new org.springframework.core.io.ByteArrayResource(imageBytes), imageMimeType)));
    }

    private Mono<ResolvedTemplate> resolveTemplate(String templateName, String subject) {
        ResolvedTemplate fileFallback = new ResolvedTemplate(templateName, subject);
        return emailTemplateRepository.findByTemplateCode(templateName)
                .map(tpl -> new ResolvedTemplate(
                        StringUtils.hasText(tpl.getContent()) ? tpl.getContent() : templateName,
                        StringUtils.hasText(tpl.getSubject()) ? tpl.getSubject() : subject))
                .defaultIfEmpty(fileFallback)
                .onErrorResume(e -> {
                    log.warn("Không lấy được email template '{}' từ DB, fallback về file .html. Lỗi: {}",
                            templateName, e.getMessage());
                    return Mono.just(fileFallback);
                });
    }

    private Mono<Void> dispatch(String to, String subject, String template, String templateOrContent, Map<String, Object> variables) {
        return dispatch(to, subject, template, templateOrContent, variables, helper -> {});
    }

    private Mono<Void> dispatch(String to, String subject, String template, String templateOrContent, Map<String, Object> variables,
                                MimeMessageCustomizer helperCustomizer) {
        return Mono.defer(() -> {
            Timer.Sample sample = Timer.start(meterRegistry);
            return Mono.fromCallable(() -> {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

                helper.setFrom(fromAddress, fromName);
                helper.setTo(to);
                helper.setSubject(subject);

                Context context = new Context();
                context.setVariables(variables);

                // templateOrContent có thể là tên file (resolver classpath) hoặc chuỗi HTML từ DB (string resolver)
                String htmlContent = templateEngine.process(templateOrContent, context);
                helper.setText(htmlContent, true);
                helperCustomizer.customize(helper);

                return message;
            })
            .subscribeOn(Schedulers.boundedElastic())
            .flatMap(message -> Mono.fromRunnable(() -> mailSender.send(message)))
            .doOnSuccess(v -> log.info("Email sent successfully to: {} with subject: {}", to, subject))
            .doOnError(e -> log.error("Failed to send email to: {}. Error: {}", to, e.getMessage(), e))
            .onErrorMap(MessagingException.class, e -> new RuntimeException("Failed to send email", e))
            .then()
            .doFinally(sig -> {
                String outcome = sig == SignalType.ON_ERROR ? "error" : "success";
                sample.stop(Timer.builder("email.send.time")
                        .description("Email send latency")
                        .tag("template", template)
                        .tag("outcome", outcome)
                        .publishPercentiles(0.5, 0.95, 0.99)
                        .publishPercentileHistogram(true)
                        .register(meterRegistry));
                meterRegistry.counter("email.send.count", "template", template, "outcome", outcome).increment();
            });
        });
    }

    /** Kết quả phân giải template: chuỗi truyền vào engine (tên file hoặc HTML) và subject cuối cùng. */
    private record ResolvedTemplate(String templateOrContent, String subject) {}

    @FunctionalInterface
    private interface MimeMessageCustomizer {
        void customize(MimeMessageHelper helper) throws MessagingException;
    }
}
