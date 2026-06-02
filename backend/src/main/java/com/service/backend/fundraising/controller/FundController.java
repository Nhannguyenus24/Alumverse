package com.service.backend.fundraising.controller;

import com.service.backend.fundraising.dto.CreateFundRequest;
import com.service.backend.fundraising.dto.FundDetailResponse;
import com.service.backend.fundraising.dto.FundListItemResponse;
import com.service.backend.fundraising.dto.UpdateFundRequest;
import com.service.backend.fundraising.dto.FundStatisticsResponse;
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

@RestController
@RequestMapping("/api/funds")
@RequiredArgsConstructor
@Validated
public class FundController {

    private final FundService fundService;

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
            @RequestParam(required = false) String statusId,
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
                        .statusId(statusId)
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

    @GetMapping("/{fundId}")
    public Mono<ResponseEntity<ApiResponse<FundDetailResponse>>> getDetail(
            @PathVariable @Min(1) Long fundId) {
        return fundService.getFundDetail(fundId)
                .map(response -> ResponseEntity.ok(
                        new ApiResponse<>("Fund retrieved successfully", response)));
    }

    @GetMapping("/status/{statusId}")
    // Dung o trang frontend cho normal user + guest voi cac quy theo hang muc QUAN TRONG hoac VUNG SAU VUNG XA 
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<FundListItemResponse>>>> getByStatusId(
            @PathVariable @Min(1) Integer statusId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit) {
        return fundService.getFundsByStatusId(page, limit, statusId)
                .map(response -> ResponseEntity.ok(
                        new ApiResponse<>("Funds retrieved successfully", response)));
    }

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
