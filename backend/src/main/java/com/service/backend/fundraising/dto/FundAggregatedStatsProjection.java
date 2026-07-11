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
public class FundAggregatedStatsProjection {
    private Long totalFunds;
    private BigDecimal totalCurrentAmount;
}
