package com.service.backend.shared.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.service.backend.shared.enums.ErrorCode;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ApiResponse<T> {

    private String message;
    private T data;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String errorCode;

    public ApiResponse(String message, T data) {
        this.message = message;
        this.data = data;
    }

    public static <T> ApiResponse<T> error(ErrorCode code) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setMessage(code.getMessage());
        response.setErrorCode(code.name());
        return response;
    }
}
