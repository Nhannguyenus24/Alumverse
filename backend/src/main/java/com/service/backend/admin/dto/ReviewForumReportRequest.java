package com.service.backend.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
    @Size(max = 255)

    private String decision;

    @Size(max = 255)


    private String action;

    @Size(max = 255)


    private String reviewNote;
}
