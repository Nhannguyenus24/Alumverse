package com.service.backend.shared.projection;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DailyCountProjection {
    private LocalDate date;
    private Long count;
}
