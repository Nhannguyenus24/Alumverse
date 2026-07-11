package com.service.backend.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Kết quả render thử: subject + HTML đã render, hoặc thông báo lỗi cú pháp template. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmailTemplatePreviewResponse {
    private String subject;
    private String html;
    /** Khác null nếu template lỗi cú pháp Thymeleaf; frontend hiển thị để admin sửa. */
    private String error;
}
