package com.service.backend.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Conversion funnels across the platform. Each list is an ordered set of funnel
 * stages ({@link StatPoint} name = stage label key, value = count at that stage).
 * The {@code *Rate} fields are pre-computed percentages (0-100) to avoid client math.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FunnelStatsDTO {
    private List<StatPoint> verification;       // members -> requested -> accepted
    private List<StatPoint> event;              // interested -> registered -> checked-in
    private List<StatPoint> donation;           // initiated -> success (+ failed/pending)
    private List<StatPoint> mentorApproval;     // submitted -> approved
    private List<StatPoint> mentorshipSession;  // booked -> confirmed -> completed

    private Double verificationRate;     // accepted / requested
    private Double eventCheckinRate;     // checked-in / registered
    private Double eventCapacityFillRate;// registered / capacity
    private Double donationSuccessRate;  // success / total
    private Double mentorApprovalRate;   // approved / submitted
    private Double sessionCompletionRate;// completed / total
}
