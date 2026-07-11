package com.service.backend.admin.service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import com.fasterxml.jackson.core.type.TypeReference;
import com.service.backend.admin.dto.EmailTemplatePreviewRequest;
import com.service.backend.admin.dto.EmailTemplatePreviewResponse;
import com.service.backend.admin.dto.EmailTemplateResponse;
import com.service.backend.admin.dto.EmailTemplateVariable;
import com.service.backend.admin.dto.UpdateEmailTemplateRequest;
import com.service.backend.shared.dao.EmailTemplateR2dbcRepository;
import com.service.backend.shared.entity.EmailTemplate;
import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.exception.ApplicationException;
import com.service.backend.shared.utils.JsonUtils;

import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Service
public class AdminEmailTemplateService {

    private static final Logger log = LoggerFactory.getLogger(AdminEmailTemplateService.class);

    private final EmailTemplateR2dbcRepository repository;
    private final TemplateEngine templateEngine;

    public AdminEmailTemplateService(EmailTemplateR2dbcRepository repository, TemplateEngine templateEngine) {
        this.repository = repository;
        this.templateEngine = templateEngine;
    }

    public Mono<List<EmailTemplateResponse>> getAll() {
        return repository.findAll(org.springframework.data.domain.Sort.by("templateCode"))
                .map(this::toResponse)
                .collectList();
    }

    public Mono<EmailTemplateResponse> getById(Long id) {
        return repository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.RESOURCES_NOT_FOUND,
                        "Không tìm thấy email template")))
                .map(this::toResponse);
    }

    public Mono<EmailTemplateResponse> update(Long id, UpdateEmailTemplateRequest request, Long updatedBy) {
        return repository.findById(id)
                .switchIfEmpty(Mono.error(new ApplicationException(ErrorCode.RESOURCES_NOT_FOUND,
                        "Không tìm thấy email template")))
                .flatMap(tpl -> {
                    tpl.setSubject(StringUtils.hasText(request.getSubject()) ? request.getSubject() : null);
                    tpl.setContent(request.getContent());
                    tpl.setUpdatedBy(updatedBy);
                    tpl.setUpdatedAt(OffsetDateTime.now());
                    return repository.save(tpl);
                })
                .map(this::toResponse);
    }

    /**
     * Render thử template với dữ liệu mẫu. Xử lý CPU-bound chạy trên boundedElastic; lỗi cú pháp
     * Thymeleaf được bắt và trả về trong trường {@code error} thay vì ném lỗi 500.
     */
    public Mono<EmailTemplatePreviewResponse> preview(EmailTemplatePreviewRequest request) {
        Map<String, Object> sampleData = request.getSampleData() != null ? request.getSampleData() : Map.of();
        return Mono.fromCallable(() -> {
            Context context = new Context();
            context.setVariables(sampleData);
            try {
                String html = templateEngine.process(request.getContent(), context);
                String subject = StringUtils.hasText(request.getSubject()) ? request.getSubject() : null;
                return new EmailTemplatePreviewResponse(subject, html, null);
            } catch (RuntimeException e) {
                log.debug("Preview template lỗi cú pháp: {}", e.getMessage());
                return new EmailTemplatePreviewResponse(null, null,
                        "Lỗi cú pháp template: " + rootMessage(e));
            }
        }).subscribeOn(Schedulers.boundedElastic());
    }

    private String rootMessage(Throwable e) {
        Throwable cur = e;
        while (cur.getCause() != null && cur.getCause() != cur) {
            cur = cur.getCause();
        }
        return cur.getMessage() != null ? cur.getMessage() : cur.getClass().getSimpleName();
    }

    private EmailTemplateResponse toResponse(EmailTemplate tpl) {
        EmailTemplateResponse res = new EmailTemplateResponse();
        res.setId(tpl.getId());
        res.setTemplateCode(tpl.getTemplateCode());
        res.setSubject(tpl.getSubject());
        res.setContent(tpl.getContent());
        res.setDescription(tpl.getDescription());
        res.setVariables(parseVariables(tpl.getVariables()));
        res.setUpdatedAt(tpl.getUpdatedAt());
        return res;
    }

    private List<EmailTemplateVariable> parseVariables(String json) {
        if (!StringUtils.hasText(json)) {
            return List.of();
        }
        try {
            List<EmailTemplateVariable> parsed =
                    JsonUtils.fromJson(json, new TypeReference<List<EmailTemplateVariable>>() {});
            return parsed != null ? parsed : List.of();
        } catch (RuntimeException e) {
            log.warn("Không parse được variables JSON: {}", e.getMessage());
            return List.of();
        }
    }
}
