package com.service.backend.shared.exception;

import com.service.backend.shared.enums.ErrorCode;
import com.service.backend.shared.dto.ApiResponse;

import lombok.extern.slf4j.Slf4j;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.support.WebExchangeBindException;
import org.springframework.web.reactive.resource.NoResourceFoundException;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

import io.micrometer.core.instrument.MeterRegistry;

/**
 * Shared Global Exception Handler used across all modules
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    private final MeterRegistry meterRegistry;

    public GlobalExceptionHandler(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    /**
     * Build an error response that always carries a stable {@code errorCode}. The frontend maps
     * this code to a localized message (see errors i18n namespace) and only falls back to
     * {@code message} when no translation key exists — so every error path must set a code.
     */
    private Mono<ResponseEntity<?>> buildError(int status, String errorCode, String message, Object data) {
        ApiResponse<Object> response = new ApiResponse<>(message, data);
        response.setErrorCode(errorCode);
        return Mono.just(ResponseEntity.status(status).body(response));
    }

    @ExceptionHandler(WebExchangeBindException.class)
    public Mono<ResponseEntity<?>> handleValidationException(WebExchangeBindException ex) {
        meterRegistry.counter("api.errors.count", "error_code", "VALIDATION_FAILED").increment();

        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String key;
            if (error instanceof FieldError fieldError) {
                key = fieldError.getField();
            } else {
                key = error.getObjectName();
            }
            String errorMessage = error.getDefaultMessage();
            errors.put(key, errorMessage);
        });
        return buildError(400, "VALIDATION_FAILED", "Validation failed", errors);
    }

    @ExceptionHandler(ApplicationException.class)
    public Mono<ResponseEntity<?>> handleApplicationException(ApplicationException ex) {
        ErrorCode errorCode = ex.getErrorCode();
        
        meterRegistry.counter("api.errors.count", "error_code", errorCode.name()).increment();
        
        ApiResponse<?> response = ApiResponse.error(errorCode);
        // Override default ErrorCode message if a custom message was provided to the exception
        if (ex.getMessage() != null && !ex.getMessage().isEmpty()) {
            response.setMessage(ex.getMessage());
        }
        
        return Mono.just(ResponseEntity.status(errorCode.getStatus()).body(response));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public Mono<ResponseEntity<?>> handleIllegalArgumentException(IllegalArgumentException ex) {
        meterRegistry.counter("api.errors.count", "error_code", "BAD_REQUEST").increment();

        return buildError(400, "BAD_REQUEST", ex.getMessage(), null);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public Mono<ResponseEntity<?>> handleNoResourceFoundException(NoResourceFoundException ex) {
        log.warn("Resource not found: {}", ex.getMessage());
        
        meterRegistry.counter("api.errors.count", "error_code", "NOT_FOUND").increment();

        return buildError(404, "NOT_FOUND", "Not found", ex.getMessage());
    }

    /**
     * Quyền bị từ chối: {@code @PreAuthorize} ném {@link AuthorizationDeniedException} (Spring
     * Security 6), còn tầng web ném {@link AccessDeniedException}. Trả 403 thay vì để rơi xuống
     * handler chung (500). VD: STAFF gọi endpoint chỉ dành cho ADMIN.
     */
    @ExceptionHandler({AuthorizationDeniedException.class, AccessDeniedException.class})
    public Mono<ResponseEntity<?>> handleAccessDenied(RuntimeException ex) {
        log.warn("Access denied: {}", ex.getMessage());

        meterRegistry.counter("api.errors.count", "error_code", "FORBIDDEN").increment();

        return buildError(403, "FORBIDDEN", "Bạn không có quyền thực hiện thao tác này", null);
    }

    /**
     * Ngoại lệ mang sẵn HTTP status (VD: {@code SseController} trả 401 khi token SSE hết hạn).
     * Không để rơi xuống handler chung — vì handler chung sẽ log ERROR kèm stacktrace và trả 500,
     * gây spam log khi {@code EventSource} tự reconnect liên tục. Ở đây chỉ log gọn theo mức status
     * và trả đúng status gốc.
     */
    @ExceptionHandler(ResponseStatusException.class)
    public Mono<ResponseEntity<?>> handleResponseStatusException(ResponseStatusException ex) {
        int status = ex.getStatusCode().value();

        if (ex.getStatusCode().is5xxServerError()) {
            log.error("Response status error {}: {}", status, ex.getReason(), ex);
        } else {
            log.debug("Response status {}: {}", status, ex.getReason());
        }

        meterRegistry.counter("api.errors.count", "error_code", "HTTP_" + status).increment();

        return buildError(status, "HTTP_" + status, ex.getReason(), null);
    }

    @ExceptionHandler(Exception.class)
    public Mono<ResponseEntity<?>> handleGenericException(Exception ex) {
        log.error("Unhandled exception occurred: {}", ex.getMessage(), ex);
        
        meterRegistry.counter("api.errors.count", "error_code", "INTERNAL_SERVER_ERROR").increment();

        return buildError(500, "INTERNAL_SERVER_ERROR", "Internal server error", null);
    }
}
