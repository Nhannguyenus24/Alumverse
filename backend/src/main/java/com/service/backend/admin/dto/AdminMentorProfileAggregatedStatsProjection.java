package com.service.backend.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminMentorProfileAggregatedStatsProjection {
    private Long totalProfiles;
    private Long approvedProfiles;
    private Long pendingProfiles;
}
