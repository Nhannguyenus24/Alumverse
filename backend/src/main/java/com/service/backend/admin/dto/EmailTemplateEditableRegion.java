package com.service.backend.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Một vùng nội dung admin được phép chỉnh sửa trong email template.
 * {@code type}: {@code text} (ô nhập một dòng) hoặc {@code html} (trình soạn rich-text).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmailTemplateEditableRegion {
    private String key;
    private String label;
    private String type;
    /** Nội dung hiện tại của vùng (đã unescape với type=text). */
    private String html;
}
