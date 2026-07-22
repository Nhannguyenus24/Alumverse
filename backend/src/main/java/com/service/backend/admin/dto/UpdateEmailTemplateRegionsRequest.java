package com.service.backend.admin.dto;

import java.util.Map;

import jakarta.validation.constraints.*;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Yêu cầu cập nhật email template theo vùng sửa được (chế độ thân thiện cho admin non-tech).
 * Backend ghép {@code regions} vào nội dung HTML gốc, giữ nguyên layout/CSS/binding.
 */
@Data
public class UpdateEmailTemplateRegionsRequest {

    /** Subject có thể để trống -> hệ thống dùng subject động truyền từ code khi gửi. */
    @Size(max = 255)

    private String subject;

    /** map {regionKey -> nội dung mới}. */
    private Map<String, String> regions;
}
