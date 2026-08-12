package com.service.backend.admin.controller;

import com.service.backend.admin.dto.FundraisingStatisticsDTO;
import com.service.backend.admin.service.AdminFundraisingService;
import com.service.backend.fundraising.dto.FundDonationListItemResponse;
import com.service.backend.shared.dto.ApiResponse;
import jakarta.validation.constraints.Min;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;

import java.time.LocalDateTime;
import java.util.List;

@Tag(name = "Admin > Fundraising", description = "API endpoints for managing fundraising campaigns by administrators")
@RestController
@RequestMapping("/api/admin/fundraising")
@Validated
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
public class AdminFundraisingController {

    private final AdminFundraisingService adminFundraisingService;

    public AdminFundraisingController(AdminFundraisingService adminFundraisingService) {
        this.adminFundraisingService = adminFundraisingService;
    }

    @GetMapping("/statistics")
    public Mono<ResponseEntity<ApiResponse<FundraisingStatisticsDTO>>> getStatistics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        return adminFundraisingService.getStatistics(from, to)
                .map(stats -> ResponseEntity.ok(
                        new ApiResponse<>("Fundraising statistics fetched successfully", stats)));
    }

    @GetMapping("/funds/{fundId}/donations/all")
    public Mono<ResponseEntity<ApiResponse<List<FundDonationListItemResponse>>>> getAllDonationsByFund(
            @PathVariable @Min(1) long fundId) {
        return adminFundraisingService.getAllDonationsByFund(fundId)
                .map(donations -> ResponseEntity.ok(
                        new ApiResponse<>("Fund donations fetched successfully", donations)));
    }
}
