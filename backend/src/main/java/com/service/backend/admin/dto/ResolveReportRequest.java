package com.service.backend.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResolveReportRequest {

    @NotBlank(message = "Hành động xử lý không được để trống")
    @Size(max = 255)

    private String action;
    
    @Size(max = 255)

    
    private String resolutionNote;
}
