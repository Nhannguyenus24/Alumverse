package com.service.backend.shared.projection;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DailyAmountProjection {
    private LocalDate date;
    private Long count;
    private BigDecimal amount;
}
