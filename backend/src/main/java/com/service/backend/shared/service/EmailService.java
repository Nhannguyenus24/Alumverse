package com.service.backend.shared.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.Map;
import java.util.Properties;

import jakarta.mail.MessagingException;
import jakarta.mail.Session;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeBodyPart;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.internet.MimeMultipart;
import jakarta.mail.util.ByteArrayDataSource;
import jakarta.activation.DataHandler;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.gmail.Gmail;
import com.google.api.services.gmail.model.Message;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.UserCredentials;
import com.service.backend.shared.dao.EmailTemplateR2dbcRepository;

import reactor.core.publisher.Mono;
import reactor.core.publisher.SignalType;
import reactor.core.scheduler.Schedulers;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;

@Service
public class EmailService {
    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private final Gmail gmailService;
    private final TemplateEngine templateEngine;
    private final MeterRegistry meterRegistry;
    private final EmailTemplateR2dbcRepository emailTemplateRepository;

    @Value("${app.mail.from-address}")
    private String fromAddress;

    @Value("${app.mail.from-name}")
    private String fromName;

    public EmailService(
            @Value("${google.mail.client-id}") String clientId,
            @Value("${google.mail.client-secret}") String clientSecret,
            @Value("${google.mail.refresh-token}") String refreshToken,
            @Qualifier("emailTemplateEngine") TemplateEngine templateEngine,
            MeterRegistry meterRegistry,
            EmailTemplateR2dbcRepository emailTemplateRepository) {

        this.templateEngine = templateEngine;
        this.meterRegistry = meterRegistry;
        this.emailTemplateRepository = emailTemplateRepository;

        UserCredentials credentials = UserCredentials.newBuilder()
                .setClientId(clientId)
                .setClientSecret(clientSecret)
                .setRefreshToken(refreshToken)
                .build();

        this.gmailService = new Gmail.Builder(
                new NetHttpTransport(),
                GsonFactory.getDefaultInstance(),
                new HttpCredentialsAdapter(credentials))
                .setApplicationName("AlumVerse")
                .build();
    }

    public Mono<Void> sendHtmlEmail(String to, String subject, String templateName, Map<String, Object> variables) {
        return resolveTemplate(templateName, subject)
                .flatMap(resolved -> dispatch(to, resolved.subject(), templateName, resolved.templateOrContent(), variables, null, null, null));
    }

    public Mono<Void> sendRawHtmlEmail(String to, String subject, String htmlContent, Map<String, Object> variables) {
        return dispatch(to, subject, "raw", htmlContent, variables, null, null, null);
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
            .flatMap(resolved -> dispatch(to, resolved.subject(), templateName, resolved.templateOrContent(), variables, contentId, imageBytes, imageMimeType));
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

    private Mono<Void> dispatch(String to, String subject, String template, String templateOrContent, Map<String, Object> variables,
                                String contentId, byte[] imageBytes, String imageMimeType) {
        return Mono.defer(() -> {
            Timer.Sample sample = Timer.start(meterRegistry);
            return Mono.fromCallable(() -> {
                Context context = new Context();
                context.setVariables(variables);
                String htmlContent = templateEngine.process(templateOrContent, context);

                Message message = createMessageWithEmail(createEmail(to, subject, htmlContent, contentId, imageBytes, imageMimeType));
                return gmailService.users().messages().send("me", message).execute();
            })
            .subscribeOn(Schedulers.boundedElastic())
            .doOnSuccess(resp -> log.info("Email sent successfully to: {} with subject: {} (id={})", to, subject, resp.getId()))
            .doOnError(e -> log.error("Failed to send email to: {}. Error: {}", to, e.getMessage(), e))
            .onErrorMap(Exception.class, e -> new RuntimeException("Failed to send email", e))
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

    private MimeMessage createEmail(String to, String subject, String htmlContent, String contentId, byte[] imageBytes, String imageMimeType) throws MessagingException {
        Properties props = new Properties();
        Session session = Session.getDefaultInstance(props, null);
        MimeMessage email = new MimeMessage(session);

        email.setFrom(new InternetAddress(formatFrom()));
        email.addRecipient(jakarta.mail.Message.RecipientType.TO, new InternetAddress(to));
        email.setSubject(subject);

        MimeMultipart multipart = new MimeMultipart("related");

        MimeBodyPart htmlPart = new MimeBodyPart();
        htmlPart.setContent(htmlContent, "text/html; charset=utf-8");
        multipart.addBodyPart(htmlPart);

        if (imageBytes != null && contentId != null) {
            MimeBodyPart imagePart = new MimeBodyPart();
            ByteArrayDataSource bds = new ByteArrayDataSource(imageBytes, imageMimeType);
            imagePart.setDataHandler(new DataHandler(bds));
            imagePart.setHeader("Content-ID", "<" + contentId + ">");
            imagePart.setDisposition(MimeBodyPart.INLINE);
            multipart.addBodyPart(imagePart);
        }

        email.setContent(multipart);
        return email;
    }

    private Message createMessageWithEmail(MimeMessage emailContent) throws MessagingException, IOException {
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        emailContent.writeTo(buffer);
        byte[] bytes = buffer.toByteArray();
        String encodedEmail = Base64.getUrlEncoder().encodeToString(bytes);
        Message message = new Message();
        message.setRaw(encodedEmail);
        return message;
    }

    private String formatFrom() {
        return StringUtils.hasText(fromName) ? fromName + " <" + fromAddress + ">" : fromAddress;
    }

    private record ResolvedTemplate(String templateOrContent, String subject) {}
}
