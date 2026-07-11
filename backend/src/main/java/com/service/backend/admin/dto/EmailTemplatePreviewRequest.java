package com.service.backend.admin.dto;

import java.util.Map;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/** Yêu cầu render thử email template với dữ liệu mẫu. */
@Data
public class EmailTemplatePreviewRequest {

    private String subject;

    @NotBlank(message = "Nội dung template không được để trống")
    private String content;

    /** Dữ liệu mẫu để thay thế biến; nếu null sẽ dùng sample mặc định phía frontend. */
    private Map<String, Object> sampleData;
}
