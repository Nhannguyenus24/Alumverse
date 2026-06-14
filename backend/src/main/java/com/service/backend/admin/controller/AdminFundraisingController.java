package com.service.backend.admin.controller;

import com.service.backend.admin.dto.FundraisingStatisticsDTO;
import com.service.backend.admin.service.AdminFundraisingService;
import com.service.backend.shared.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Admin > Fundraising", description = "API endpoints for managing fundraising campaigns by administrators")
@RestController
@RequestMapping("/api/admin/fundraising")
@Validated
public class AdminFundraisingController {

    private final AdminFundraisingService adminFundraisingService;

    public AdminFundraisingController(AdminFundraisingService adminFundraisingService) {
        this.adminFundraisingService = adminFundraisingService;
    }

    @GetMapping("/statistics")
    public Mono<ResponseEntity<ApiResponse<FundraisingStatisticsDTO>>> getStatistics() {
        return adminFundraisingService.getStatistics()
                .map(stats -> ResponseEntity.ok(
                        new ApiResponse<>("Fundraising statistics fetched successfully", stats)));
    }
}
