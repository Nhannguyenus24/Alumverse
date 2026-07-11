package com.service.backend.shared.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.OffsetDateTime;

/**
 * Email template chỉnh sửa được qua Admin.
 *
 * <p>{@code content} là chuỗi HTML (hỗ trợ cú pháp Thymeleaf). Khi gửi email, EmailService ưu tiên
 * dùng {@code content} từ DB; nếu trống thì fallback về file {@code templates/<templateCode>.html}.
 * Cột {@code variables} là JSON text định nghĩa các biến khả dụng + giá trị mẫu (dùng cho UI chèn
 * biến và preview) — được ánh xạ dạng String theo convention JSON của codebase (xem {@link SurveyForm}).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("email_templates")
public class EmailTemplate {

    @Id
    private Long id;

    @Column("template_code")
    private String templateCode;

    private String subject;

    private String content;

    private String description;

    /** JSON array text: [{"key":"otp","label":"Mã OTP","sample":"123456"}, ...] */
    private String variables;

    @Column("updated_by")
    private Long updatedBy;

    @Column("updated_at")
    private OffsetDateTime updatedAt;
}
