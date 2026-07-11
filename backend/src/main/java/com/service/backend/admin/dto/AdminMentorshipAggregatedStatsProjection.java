package com.service.backend.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminMentorshipAggregatedStatsProjection {
    private Long totalSessions;
    private Long pendingSessions;
    private Long confirmedSessions;
    private Long completedSessions;
    private Long cancelledSessions;
    private Long rejectedSessions;
}
