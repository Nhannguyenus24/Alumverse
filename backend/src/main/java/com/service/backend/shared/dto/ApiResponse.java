package com.service.backend.shared.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Shared API Response DTO used across all modules
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {

    private String message;
    private T data;

    public ApiResponse(T data) {
        this.data = data;
        this.message = "";
    }
}
