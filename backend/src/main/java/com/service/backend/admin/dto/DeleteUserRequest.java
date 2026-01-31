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
public class DeleteUserRequest {
    
    @NotNull(message = "User ID is required")
    private Integer userId;
    
    private Boolean hardDelete = false;
}
