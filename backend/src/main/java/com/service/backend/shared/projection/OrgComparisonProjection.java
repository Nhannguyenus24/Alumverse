package com.service.backend.shared.projection;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Per-organization activity counters used by the cross-organization comparison chart.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrgComparisonProjection {
    private Integer orgId;
    private String name;
    private Long members;
    private Long events;
    private Long topics;
    private Long jobs;
}
