package com.service.backend.shared.service;

import java.time.OffsetDateTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.service.backend.shared.dao.EmailTemplateR2dbcRepository;
import com.service.backend.shared.utils.JsonUtils;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Lúc khởi động, điền {@code content} cho các bản ghi email_templates còn trống bằng nội dung
 * file {@code templates/<code>.html} trên classpath. Nhờ vậy admin thấy sẵn nội dung hiện tại để
 * chỉnh sửa, mà không cần nhồi HTML dài vào file migration SQL.
 *
 * <p>Chỉ cập nhật khi bản ghi đã tồn tại (do migration tạo) và content đang trống — không tạo mới,
 * không ghi đè nội dung admin đã sửa. Chạy bất đồng bộ; nếu bảng/bản ghi chưa có thì bỏ qua an toàn.
 */
@Component
public class EmailTemplateSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(EmailTemplateSeeder.class);

    private static final List<String> TEMPLATE_CODES = List.of(
            "otpVerification",
            "eventInvitation",
            "eventReminder",
            "eventTicket",
            "mentorApplicationReview",
            "donationThankYou");

    private final EmailTemplateR2dbcRepository repository;

    public EmailTemplateSeeder(EmailTemplateR2dbcRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(ApplicationArguments args) {
        Flux.fromIterable(TEMPLATE_CODES)
                .flatMap(this::seedContentIfBlank)
                .doOnError(e -> log.warn("Bỏ qua seed email template (có thể migration chưa chạy): {}", e.getMessage()))
                .onErrorResume(e -> Mono.empty())
                .subscribe();
    }

    private Mono<Void> seedContentIfBlank(String code) {
        return repository.findByTemplateCode(code)
                .flatMap(tpl -> {
                    if (StringUtils.hasText(tpl.getContent())) {
                        return Mono.empty();
                    }
                    String html = readTemplateFile(code);
                    if (!StringUtils.hasText(html)) {
                        return Mono.empty();
                    }
                    tpl.setContent(html);
                    tpl.setUpdatedAt(OffsetDateTime.now());
                    return repository.save(tpl)
                            .doOnSuccess(saved -> log.info("Seeded email template content cho '{}'", code));
                })
                .onErrorResume(e -> {
                    log.warn("Không seed được email template '{}': {}", code, e.getMessage());
                    return Mono.empty();
                })
                .then();
    }

    private String readTemplateFile(String code) {
        try {
            return JsonUtils.readResourceAsString("templates/" + code + ".html");
        } catch (RuntimeException e) {
            log.warn("Không đọc được file templates/{}.html: {}", code, e.getMessage());
            return null;
        }
    }
}
