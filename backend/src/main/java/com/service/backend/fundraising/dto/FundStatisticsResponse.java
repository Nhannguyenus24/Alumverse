package com.service.backend.fundraising.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FundStatisticsResponse {

    @Schema(example = "125000000.00")
    private BigDecimal totalCurrentAmount; // Tổng current_amount của tất cả quỹ

    @Schema(example = "42")
    private Long totalFunds; // Tổng số quỹ

    @Schema(example = "368")
    private Long totalDonations; // Tổng số lượt quyên góp

    @Schema(example = "32000000.00")
    private BigDecimal totalDonationsAmountThisMonth; // Tổng số tiền quyên góp trong tháng hiện tại
}
