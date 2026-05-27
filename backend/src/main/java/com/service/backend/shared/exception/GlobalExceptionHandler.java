package com.service.backend.shared.exception;

import com.service.backend.shared.constants.ErrorCode;
import com.service.backend.shared.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.support.WebExchangeBindException;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

/**
 * Shared Global Exception Handler used across all modules
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(WebExchangeBindException.class)
    public Mono<ResponseEntity<?>> handleValidationException(WebExchangeBindException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        return Mono.just(
                ResponseEntity
                        .status(400)
                        .body(new ApiResponse<>("Validation failed", errors))
        );
    }

    @ExceptionHandler(ApplicationException.class)
    public Mono<ResponseEntity<?>> handleApplicationException(ApplicationException ex) {
        ErrorCode errorCode = ex.getErrorCode();
        
        ApiResponse<?> response = ApiResponse.error(errorCode);
        // Override default ErrorCode message if a custom message was provided to the exception
        if (ex.getMessage() != null && !ex.getMessage().isEmpty()) {
            response.setMessage(ex.getMessage());
        }
        
        return Mono.just(ResponseEntity.status(errorCode.getStatus()).body(response));
    }

    @ExceptionHandler(Exception.class)
    public Mono<ResponseEntity<?>> handleGenericException(Exception ex) {
        return Mono.just(
                ResponseEntity
                        .status(500)
                        .body(new ApiResponse<>("Internal server error", ex.getMessage()))
        );
    }
}
