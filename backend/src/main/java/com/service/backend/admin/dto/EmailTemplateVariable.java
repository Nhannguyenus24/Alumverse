package com.service.backend.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Định nghĩa một biến khả dụng trong email template (dùng cho chip chèn biến + preview). */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmailTemplateVariable {
    private String key;
    private String label;
    private String sample;
}
