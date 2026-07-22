package com.service.backend.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** Yêu cầu cập nhật email template (subject + nội dung HTML). */
@Data
public class UpdateEmailTemplateRequest {

    /** Subject có thể để trống -> hệ thống dùng subject động truyền từ code khi gửi. */
    @Size(max = 255)

    private String subject;

    @NotBlank(message = "Nội dung template không được để trống")
    @Size(max = 255)

    private String content;
}
