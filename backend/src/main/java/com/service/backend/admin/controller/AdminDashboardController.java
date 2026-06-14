package com.service.backend.admin.controller;

import com.service.backend.admin.dto.ActivityItemDTO;
import com.service.backend.admin.dto.DashboardMetricsDTO;
import com.service.backend.admin.service.AdminDashboardService;
import com.service.backend.shared.dto.ApiResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import reactor.core.publisher.Mono;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Admin > Dashboard", description = "API endpoints for admin dashboard metrics and statistics")
@RestController
@RequestMapping("/api/admin/dashboard")
public class AdminDashboardController {

    private final AdminDashboardService dashboardService;

    public AdminDashboardController(AdminDashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/metrics")
    public Mono<ResponseEntity<ApiResponse<DashboardMetricsDTO>>> getMetrics() {
        return dashboardService.getMetrics()
                .map(metrics -> ResponseEntity.ok(new ApiResponse<>("Metrics fetched", metrics)));
    }

    @GetMapping("/activities")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<ActivityItemDTO>>>> getActivities(
            @RequestParam(required = false) Integer organizationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return dashboardService.getActivities(organizationId, page, size)
                .map(res -> ResponseEntity.ok(new ApiResponse<>("Activities fetched", res)));
    }
}
