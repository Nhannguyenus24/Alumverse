package com.service.backend.shared.service;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    public EmailService(JavaMailSender mailSender, TemplateEngine templateEngine, MeterRegistry meterRegistry,
                        EmailTemplateR2dbcRepository emailTemplateRepository) {
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
        this.meterRegistry = meterRegistry;
        this.emailTemplateRepository = emailTemplateRepository;
    }

    /**
     * Gửi email HTML với template (Reactive).
     *
     * <p>Nội dung template được phân giải ưu tiên từ DB (bảng {@code email_templates}) theo
     * {@code templateName}; nếu không có bản ghi hoặc {@code content} trống thì fallback về file
     * {@code templates/<templateName>.html}. Tương tự, nếu bản ghi DB có {@code subject} thì dùng
     * subject đó (admin cấu hình), ngược lại dùng {@code subject} truyền vào (subject động từ code).
     */
    public Mono<Void> sendHtmlEmail(String to, String subject, String templateName, Map<String, Object> variables) {
        return resolveTemplate(templateName, subject)
                .flatMap(resolved -> dispatch(to, resolved.subject(), resolved.templateOrContent(), variables));
    }

    /**
     * Phân giải template: trả về chuỗi để đưa vào {@code templateEngine.process(...)}.
     * - Có content trong DB  -> trả chính chuỗi HTML (StringTemplateResolver xử lý).
     * - Không có / content trống / lỗi truy vấn -> trả tên template (ClassLoaderTemplateResolver đọc file).
     */
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

    private Mono<Void> dispatch(String to, String subject, String templateOrContent, Map<String, Object> variables) {
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

                return message;
            })
            .subscribeOn(Schedulers.boundedElastic())
            .flatMap(message -> Mono.fromRunnable(() -> mailSender.send(message)))
            .doOnSuccess(v -> log.info("Email sent successfully to: {} with subject: {}", to, subject))
            .doOnError(e -> log.error("Failed to send email to: {}. Error: {}", to, e.getMessage(), e))
            .onErrorMap(MessagingException.class, e -> new RuntimeException("Failed to send email", e))
            .then()
            .doFinally(sig -> sample.stop(meterRegistry.timer("email.send.time")));
        });
    }

    /** Kết quả phân giải template: chuỗi truyền vào engine (tên file hoặc HTML) và subject cuối cùng. */
    private record ResolvedTemplate(String templateOrContent, String subject) {}
}
