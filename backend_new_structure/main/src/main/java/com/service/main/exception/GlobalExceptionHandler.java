package com.service.main.exception;

import com.service.common.dto.ApiResponse;
import com.service.common.exception.ApplicationException;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

/**
 * Shared Global Exception Handler used across all modules
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public Mono<ResponseEntity<?>> handleValidationException(MethodArgumentNotValidException ex) {
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
        return Mono.just(
                ResponseEntity
                        .status(400)
                        .body(new ApiResponse<>(ex.getMessage(), ex.getErrorCode()))
        );
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
