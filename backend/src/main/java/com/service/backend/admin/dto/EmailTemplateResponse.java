package com.service.backend.admin.dto;

import java.time.OffsetDateTime;
import java.util.List;

import lombok.Data;

/** Trả về thông tin email template cho Admin (dùng cho cả danh sách và chi tiết). */
@Data
public class EmailTemplateResponse {
    private Long id;
    private String templateCode;
    private String subject;
    private String content;
    private String description;
    private List<EmailTemplateVariable> variables;
    private OffsetDateTime updatedAt;
}
