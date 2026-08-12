package com.service.backend.admin.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.service.backend.admin.service.AdminMonitoringService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

/**
 * Proxy Datadog v1 timeseries cho trang Admin → System Monitoring. Frontend gọi
 * endpoint này (kèm JWT) thay vì gọi thẳng Datadog để tránh CORS và không lộ key.
 */
@Tag(name = "Admin > Monitoring", description = "Datadog metrics proxy for the admin monitoring page")
@RestController
@RequestMapping("/api/admin/monitoring")
@PreAuthorize("hasRole('ADMIN')")
public class AdminMonitoringController {

    private final AdminMonitoringService monitoringService;

    public AdminMonitoringController(AdminMonitoringService monitoringService) {
        this.monitoringService = monitoringService;
    }

    /**
     * Chuyển tiếp một truy vấn tới Datadog. Trả nguyên body JSON của Datadog
     * ({@code { series: [...] }}) để frontend đọc {@code res.data.series} như cũ.
     */
    @GetMapping("/datadog/query")
    public Mono<ResponseEntity<JsonNode>> datadogQuery(
            @RequestParam String query,
            @RequestParam long from,
            @RequestParam long to) {
        return monitoringService.query(query, from, to)
                .map(ResponseEntity::ok);
    }
}
