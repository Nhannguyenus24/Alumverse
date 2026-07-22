package com.service.backend.admin.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BanUserRequest {
    
    @NotNull(message = "User ID is required")
    @NotNull

    @Min(value = 1)

    private Integer userId;
}
