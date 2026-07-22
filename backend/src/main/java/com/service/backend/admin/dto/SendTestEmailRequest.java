package com.service.backend.admin.dto;

import java.util.Map;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SendTestEmailRequest {

    @NotBlank(message = "Email người nhận không được để trống")
    @Email(message = "Email người nhận không hợp lệ")
    @Size(max = 255)

    private String recipientEmail;

    @Size(max = 255)


    private String subject;

    @NotBlank(message = "Nội dung template không được để trống")
    @Size(max = 255)

    private String content;

    private Map<String, Object> sampleData;
}
