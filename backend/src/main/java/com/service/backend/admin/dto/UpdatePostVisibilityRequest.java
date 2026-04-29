package com.service.backend.admin.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdatePostVisibilityRequest {
    @NotNull(message = "Hidden status is required")
    private Boolean hidden;

    @NotNull(message = "Admin user ID is required")
    private Integer adminUserId;
}
