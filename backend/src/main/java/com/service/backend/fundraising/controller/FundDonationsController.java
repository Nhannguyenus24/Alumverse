package com.service.backend.fundraising.controller;

import com.service.backend.fundraising.dto.CreateFundDonationRequest;
import com.service.backend.fundraising.dto.FundDonationCheckoutResponse;
import com.service.backend.fundraising.dto.FundDonationListItemResponse;
import com.service.backend.fundraising.service.FundService;
import com.service.backend.shared.dto.ApiResponse;
import com.service.backend.shared.dto.PaginatedResponse;
import com.service.backend.shared.annotations.PublicEndpoint;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;
import io.swagger.v3.oas.annotations.tags.Tag;


@Tag(name = "Fundraising > Donations", description = "API endpoints for managing fund donations")
@RestController
@RequestMapping("/api/fund-donations")
@RequiredArgsConstructor
@Validated
public class FundDonationsController {

    private final FundService fundService;

    @PublicEndpoint
    @PostMapping
    public Mono<ResponseEntity<ApiResponse<FundDonationCheckoutResponse>>> createDonation(
            @Valid @RequestBody CreateFundDonationRequest request
    ) {
        return fundService.createFundDonationAndPaymentLink(request)
                .map(result -> ResponseEntity
                        .status(HttpStatus.CREATED)
                        .body(new ApiResponse<>("Fund donation created and payment link generated successfully", result)));
    }

    @PublicEndpoint
    @GetMapping("/{fundId}")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<FundDonationListItemResponse>>>> getDonations(
            @PathVariable @Min(1) Long fundId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit,
            @RequestParam(required = false) String searchBy,
            @RequestParam(required = false) String keyword
    ) {
        return fundService.getDonationsByFund(fundId, page, limit, searchBy, keyword)
                .map(response -> ResponseEntity.ok(
                        new ApiResponse<>("Fund donations retrieved successfully", response)
                ));
    }

    @PublicEndpoint
    @GetMapping("/user/{userId}")
    public Mono<ResponseEntity<ApiResponse<PaginatedResponse<FundDonationListItemResponse>>>> getByUserId(
            @PathVariable @Min(1) Integer userId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) int limit
    ) {
        return fundService.getDonationsByDonorMemberId(userId, page, limit)
                .map(response -> ResponseEntity.ok(
                        new ApiResponse<>("Fund donations by user retrieved successfully", response)
                ));
    }

    
}
