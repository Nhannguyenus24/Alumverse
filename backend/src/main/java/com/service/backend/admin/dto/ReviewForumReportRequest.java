package com.service.backend.admin.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewForumReportRequest {
    @NotBlank(message = "Decision is required")
    private String decision;

    @NotBlank(message = "Action is required")
    private String action;

    private String reviewNote;
}
