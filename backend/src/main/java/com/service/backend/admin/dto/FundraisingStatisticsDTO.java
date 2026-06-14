package com.service.backend.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FundraisingStatisticsDTO {

    private Long totalFunds;
    private Long activeFunds;
    private Long completedFunds;
    private BigDecimal totalTarget;
    private BigDecimal totalRaised;

    private Long totalDonations;
    private Long successfulDonations;
    private Long pendingDonations;
    private Long failedDonations;
    private BigDecimal successfulAmount;

    private List<FundSummary> topFundsByRaised;
    private List<DayCount> donationTimeline;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FundSummary {
        private Long fundId;
        private String name;
        private BigDecimal currentAmount;
        private BigDecimal targetAmount;
        private Long donorCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DayCount {
        private String date;
        private Long count;
        private BigDecimal amount;
    }
}
