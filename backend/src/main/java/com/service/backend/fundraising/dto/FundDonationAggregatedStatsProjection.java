package com.service.backend.fundraising.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FundDonationAggregatedStatsProjection {
    private Long totalDonations;
    private BigDecimal totalDonationsAmountThisMonth;
}
