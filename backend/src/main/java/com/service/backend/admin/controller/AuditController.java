package com.service.backend.admin.controller;

import com.service.backend.admin.dto.LoginHistoryResponse;
import com.service.backend.admin.dto.SuspiciousLoginInfo;
import com.service.backend.admin.service.AuditService;
import com.service.backend.shared.dto.ApiResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import jakarta.validation.constraints.Min;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Admin > Audit", description = "API endpoints for viewing system audit logs")
@RestController
@RequestMapping("/api/admin/audit")
@Validated
public class AuditController {

    private final AuditService auditService;

    public AuditController(AuditService auditService) {
        this.auditService = auditService;
    }

    /**
     * Get all login histories with pagination, optionally filtered by organization
     */
    @GetMapping("/login-history")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<LoginHistoryResponse>>>> getLoginHistories(
            @RequestParam(required = false) Integer organizationId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) int size) {
        return auditService.getLoginHistories(organizationId, page, size)
                .map(data -> ResponseEntity.ok(
                        new ApiResponse<>("Login histories fetched successfully", data)));
    }

    /**
     * Get login histories for a specific user
     */
    @GetMapping("/login-history/user/{userId}")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<LoginHistoryResponse>>>> getLoginHistoriesByUser(
            @PathVariable Integer userId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) int size) {
        return auditService.getLoginHistoriesByUser(userId, page, size)
                .map(data -> ResponseEntity.ok(
                        new ApiResponse<>("Login histories fetched successfully", data)));
    }

    /**
     * Get aggregated login stats: breakdown by method and daily counts for last 30 days
     */
    @GetMapping("/login-history/stats")
    public Mono<ResponseEntity<ApiResponse<Map<String, Object>>>> getLoginStats() {
        return auditService.getLoginStats()
                .map(data -> ResponseEntity.ok(
                        new ApiResponse<>("Login stats fetched successfully", data)));
    }

    /**
     * Get users with logins from more than 3 distinct IPs in the last 7 days
     */
    @GetMapping("/login-history/suspicious")
    public Mono<ResponseEntity<ApiResponse<List<SuspiciousLoginInfo>>>> getSuspiciousLogins() {
        return auditService.getSuspiciousLogins()
                .map(data -> ResponseEntity.ok(
                        new ApiResponse<>("Suspicious logins fetched successfully", data)));
    }
}
