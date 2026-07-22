package com.service.backend.admin.dto;

import java.util.Map;

import jakarta.validation.constraints.*;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** Yêu cầu render thử template theo vùng sửa được (ghép regions vào content gốc rồi render). */
@Data
public class PreviewEmailTemplateRegionsRequest {

    @Size(max = 255)


    private String subject;

    /** map {regionKey -> nội dung mới}. */
    private Map<String, String> regions;

    /** Dữ liệu mẫu để thay thế biến; nếu null sẽ dùng sample mặc định phía frontend. */
    private Map<String, Object> sampleData;
}
