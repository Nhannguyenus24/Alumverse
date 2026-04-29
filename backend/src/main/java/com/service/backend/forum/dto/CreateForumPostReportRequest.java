package com.service.backend.forum.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateForumPostReportRequest {
    @NotNull(message = "Reporter member ID is required")
    @Min(value = 1, message = "Reporter member ID must be greater than 0")
    private Integer reporterMemberId;

    @NotBlank(message = "Reason is required")
    @Size(max = 100, message = "Reason must be less than 100 characters")
    private String reason;

    @Size(max = 1000, message = "Description must be less than 1000 characters")
    private String description;
}
