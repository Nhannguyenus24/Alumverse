package com.service.backend.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminFundDonationAggregatedStatsProjection {
    private Long totalDonations;
    private Long successfulDonations;
    private Long pendingDonations;
    private Long failedDonations;
    private BigDecimal successfulAmount;
}
