package com.service.backend.admin.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ResolveReportRequest {

    @NotBlank(message = "Hành động xử lý không được để trống")
    private String action;
    
    private String resolutionNote;
}
