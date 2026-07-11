package com.service.backend.shared.dao;

import com.service.backend.shared.entity.EmailTemplate;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

/**
 * Repository cho {@link EmailTemplate}. Đặt tại {@code shared/dao} để cả EmailService (shared) và
 * AdminEmailTemplateService (admin) dùng chung mà không tạo phụ thuộc ngược từ shared -> admin.
 */
@Repository
public interface EmailTemplateR2dbcRepository extends R2dbcRepository<EmailTemplate, Long> {

    Mono<EmailTemplate> findByTemplateCode(String templateCode);
}
