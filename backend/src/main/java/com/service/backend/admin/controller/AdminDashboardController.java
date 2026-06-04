package com.service.backend.admin.controller;
import com.service.backend.admin.dto.*;
import com.service.backend.admin.service.AdminDashboardService;
import com.service.backend.shared.dto.ApiResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import reactor.core.publisher.Mono;

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

    @GetMapping("/overview")
    public Mono<ResponseEntity<ApiResponse<GlobalOverviewDTO>>> getOverview() {
        return dashboardService.getGlobalOverview()
                .map(res -> ResponseEntity.ok(new ApiResponse<>("Global overview fetched", res)));
    }

    @GetMapping("/workload")
    public Mono<ResponseEntity<ApiResponse<PendingWorkloadDTO>>> getWorkload() {
        return dashboardService.getPendingWorkload()
                .map(res -> ResponseEntity.ok(new ApiResponse<>("Pending workload fetched", res)));
    }

    @GetMapping("/comparison")
    public Mono<ResponseEntity<ApiResponse<OrganizationComparisonDTO>>> getComparison() {
        return dashboardService.getOrganizationComparison()
                .map(res -> ResponseEntity.ok(new ApiResponse<>("Organization comparison fetched", res)));
    }

    @GetMapping("/features")
    public Mono<ResponseEntity<ApiResponse<FeatureUsageDTO>>> getFeatures() {
        return dashboardService.getFeatureUsageSummary()
                .map(res -> ResponseEntity.ok(new ApiResponse<>("Feature usage summary fetched", res)));
    }

    @GetMapping("/moderation")
    public Mono<ResponseEntity<ApiResponse<ModerationSummaryDTO>>> getModeration() {
        return dashboardService.getModerationSummary()
                .map(res -> ResponseEntity.ok(new ApiResponse<>("Moderation summary fetched", res)));
    }

    @GetMapping("/health")
    public Mono<ResponseEntity<ApiResponse<SystemHealthDTO>>> getHealth() {
        return dashboardService.getSystemHealth()
                .map(res -> ResponseEntity.ok(new ApiResponse<>("System health fetched", res)));
    }

    @GetMapping("/activities")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<ActivityItemDTO>>>> getActivities(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return dashboardService.getActivities(page, size)
                .map(res -> ResponseEntity.ok(new ApiResponse<>("Activities fetched", res)));
    }
}
