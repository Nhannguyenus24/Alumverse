package com.service.backend.admin.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class FitBotKnowledgeRequest {

    @NotBlank(message = "title không được để trống")
    private String title;

    @NotBlank(message = "content không được để trống")
    private String content;

    private Boolean enabled;
}
