package com.service.backend.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerificationStatsProjection {
    private Long totalRequests;
    private Long pendingRequests;
    private Long approvedRequests;
    private Long rejectedRequests;
    private Long needsRevisionRequests;
}
