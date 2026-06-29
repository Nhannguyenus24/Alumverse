package com.service.backend.admin.controller;

import com.service.backend.admin.dto.ActivityItemDTO;
import com.service.backend.admin.dto.CohortStatsDTO;
import com.service.backend.admin.dto.DashboardMetricsDTO;
import com.service.backend.admin.dto.EngagementStatsDTO;
import com.service.backend.admin.dto.FunnelStatsDTO;
import com.service.backend.admin.dto.PlatformStatsDTO;
import com.service.backend.admin.service.AdminDashboardService;
import com.service.backend.admin.service.AdminInsightsService;
import com.service.backend.shared.dto.ApiResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.service.backend.shared.utils.SecurityUtils;
import reactor.core.publisher.Mono;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;

@Tag(name = "Admin > Dashboard", description = "API endpoints for admin dashboard metrics and statistics")
@RestController
@RequestMapping("/api/admin/dashboard")
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
public class AdminDashboardController {

    private final AdminDashboardService dashboardService;
    private final AdminInsightsService insightsService;

    public AdminDashboardController(AdminDashboardService dashboardService,
                                    AdminInsightsService insightsService) {
        this.dashboardService = dashboardService;
        this.insightsService = insightsService;
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
        return SecurityUtils.resolveOrganizationId(organizationId)
                .flatMap(resolvedOrgId -> dashboardService.getActivities(resolvedOrgId, page, size))
                .switchIfEmpty(dashboardService.getActivities(null, page, size))
                .map(res -> ResponseEntity.ok(new ApiResponse<>("Activities fetched", res)));
    }

    @GetMapping("/funnels")
    public Mono<ResponseEntity<ApiResponse<FunnelStatsDTO>>> getFunnels() {
        return insightsService.getFunnels()
                .map(f -> ResponseEntity.ok(new ApiResponse<>("Funnels fetched", f)));
    }

    @GetMapping("/cohorts")
    public Mono<ResponseEntity<ApiResponse<CohortStatsDTO>>> getCohorts() {
        return insightsService.getCohorts()
                .map(c -> ResponseEntity.ok(new ApiResponse<>("Cohorts fetched", c)));
    }

    @GetMapping("/engagement")
    public Mono<ResponseEntity<ApiResponse<EngagementStatsDTO>>> getEngagement() {
        return insightsService.getEngagement()
                .map(e -> ResponseEntity.ok(new ApiResponse<>("Engagement fetched", e)));
    }

    @GetMapping("/platform")
    public Mono<ResponseEntity<ApiResponse<PlatformStatsDTO>>> getPlatform() {
        return insightsService.getPlatform()
                .map(p -> ResponseEntity.ok(new ApiResponse<>("Platform stats fetched", p)));
    }
}
