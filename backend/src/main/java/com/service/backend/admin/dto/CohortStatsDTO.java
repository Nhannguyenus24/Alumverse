package com.service.backend.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Member demographics / cohort distributions. Each list is a set of
 * {@link StatPoint} buckets (name = bucket label, value = member count).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CohortStatsDTO {
    private List<StatPoint> byStartedYear;
    private List<StatPoint> byGraduatedYear;
    private List<StatPoint> byGraduationStatus;
    private List<StatPoint> byGender;
    private List<StatPoint> byAgeBucket;
    private List<StatPoint> byVerificationLevel;
}
