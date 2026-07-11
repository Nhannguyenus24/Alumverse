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
public class AdminFundAggregatedStatsProjection {
    private Long totalFunds;
    private Long activeFunds;
    private Long completedFunds;
    private BigDecimal totalTargetAmount;
    private BigDecimal totalCurrentAmount;
}
