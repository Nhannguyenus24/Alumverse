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
    /** Các vùng nội dung admin được phép sửa (rỗng nếu template chưa gắn marker vùng). */
    private List<EmailTemplateEditableRegion> regions;
    /** true nếu template có vùng sửa được -> frontend hiển thị chế độ chỉnh sửa thân thiện. */
    private boolean editable;
    private OffsetDateTime updatedAt;
}
