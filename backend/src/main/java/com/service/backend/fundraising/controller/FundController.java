package com.service.backend.fundraising.controller;

import com.service.backend.fundraising.dto.CreateFundRequest;
import com.service.backend.fundraising.dto.FundDetailResponse;
import com.service.backend.fundraising.dto.FundListItemResponse;
import com.service.backend.fundraising.dto.UpdateFundRequest;
import com.service.backend.fundraising.dto.UpdateFundBasicInfoRequest;
import com.service.backend.fundraising.dto.UpdateFundDonationVisibilityRequest;
import com.service.backend.fundraising.dto.FundStatisticsResponse;
import com.service.backend.fundraising.dto.SupportedBanksResponse;
import com.service.backend.shared.entity.Funds;
import com.service.backend.fundraising.service.FundService;
import com.service.backend.shared.dto.ApiResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;
import com.service.backend.fundraising.dto.FundFilterRequest;
import com.service.backend.shared.dto.DataWithWarnings;
import com.service.backend.shared.annotations.PublicEndpoint;
import com.service.backend.shared.annotations.PrivateEndpoint;
import org.springframework.security.access.prepost.PreAuthorize;
import io.swagger.v3.oas.annotations.tags.Tag;

@PublicEndpoint
@Tag(name = "Fundraising > Funds", description = "API endpoints for viewing and managing fundraising funds")
@RestController
@RequestMapping("/api/funds")
@RequiredArgsConstructor
@Validated
public class FundController {

    private final FundService fundService;

    @PrivateEndpoint
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public Mono<ResponseEntity<ApiResponse<Funds>>> createFund(
            @Valid @RequestBody CreateFundRequest request) {
        return fundService.createFund(request)
                .map(createdFund -> ResponseEntity
                        .status(HttpStatus.CREATED)
                        .body(new ApiResponse<>("Fund created successfully", createdFund)));
    }

    @GetMapping
    public Mono<ResponseEntity<ApiResponse<DataWithWarnings<PaginatedResponse<FundListItemResponse>>>>> getAll(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String organizationId,
            @RequestParam(required = false) String timeStartedFrom,
            @RequestParam(required = false) String timeStartedTo,
            @RequestParam(required = false) String targetAmountMin,
            @RequestParam(required = false) String targetAmountMax,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String direction
    ) {
        FundFilterRequest req =
                FundFilterRequest.builder()
                        .page(page)
                        .size(limit)
                        .q(q)
                        .organizationId(organizationId)
                        .timeStartedFrom(timeStartedFrom)
                        .timeStartedTo(timeStartedTo)
                        .targetAmountMin(targetAmountMin)
                        .targetAmountMax(targetAmountMax)
                        .sortBy(sortBy)
                        .direction(direction)
                        .build();
        return fundService.getFundsForList(req)
                .map(result -> ResponseEntity.ok(
                        new ApiResponse<>("Funds retrieved successfully", result)
                ));
    }

    @GetMapping("/banks")
    public Mono<ResponseEntity<ApiResponse<SupportedBanksResponse>>> getSupportedBanks() {
        return fundService.getSupportedBanksResponse()
                .map(response -> ResponseEntity.ok(
                        new ApiResponse<>("Supported banks retrieved successfully", response)));
    }

    @GetMapping("/{fundId}")
    public Mono<ResponseEntity<ApiResponse<FundDetailResponse>>> getDetail(
            @PathVariable @Min(1) Long fundId) {
        return fundService.getFundDetail(fundId)
                .map(response -> ResponseEntity.ok(
                        new ApiResponse<>("Fund retrieved successfully", response)));
    }

    @PrivateEndpoint
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{fundId}")
    // co the update 1 field hoac nhieu field trong {name, manager_name, description_short, description_full, logoUrl, organizationId}
    public Mono<ResponseEntity<ApiResponse<Funds>>> updateFund(
            @PathVariable @Min(1) Long fundId,
            @Valid @RequestBody UpdateFundRequest request
    ) {
        return fundService.updateFund(fundId, request)
                .map(updated -> ResponseEntity.ok(
                        new ApiResponse<>("Fund updated successfully", updated)
                ));
    }

    @PrivateEndpoint
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @PatchMapping("/{fundId}/basic-info")
    public Mono<ResponseEntity<ApiResponse<Funds>>> updateFundBasicInfo(
            @PathVariable @Min(1) Long fundId,
            @Valid @RequestBody UpdateFundBasicInfoRequest request) {
        return fundService.updateFundBasicInfo(fundId, request)
                .map(updated -> ResponseEntity.ok(
                        new ApiResponse<>("Fund basic info updated successfully", updated)));
    }

    @PrivateEndpoint
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @PutMapping("/{fundId}/donation-visibility")
    public Mono<ResponseEntity<ApiResponse<Funds>>> updateDonationVisibility(
            @PathVariable @Min(1) Long fundId,
            @Valid @RequestBody UpdateFundDonationVisibilityRequest request) {
        return fundService.updateDonationVisibility(fundId, request.getIsPublic())
                .map(updated -> ResponseEntity.ok(
                        new ApiResponse<>("Fund donation visibility updated successfully", updated)
                ));
    }

    @PrivateEndpoint
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{fundId}/close")
    public Mono<ResponseEntity<ApiResponse<Funds>>> closeFund(
            @PathVariable @Min(1) Long fundId
    ) {
        return fundService.closeFund(fundId)
                .map(updated -> ResponseEntity.ok(
                        new ApiResponse<>("Fund closed successfully", updated)
                ));
    }


    @GetMapping("/statistics")
    public Mono<ResponseEntity<ApiResponse<FundStatisticsResponse>>> getStatistics() {
        return fundService.getFundStatistics()
                .map(stats -> ResponseEntity.ok(
                        new ApiResponse<>("Fund statistics retrieved successfully", stats)
                ));
    }
}
