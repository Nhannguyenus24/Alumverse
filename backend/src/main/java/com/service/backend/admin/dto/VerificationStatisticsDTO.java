package com.service.backend.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerificationStatisticsDTO {

    private Long totalAlumniVerificationRequests;
    private Long pendingAlumniRequests;
    private Long approvedAlumniRequests;
    private Long rejectedAlumniRequests;
    private Long needsRevisionRequests;

    private Long totalPeerVerifications;
    private Long pendingPeerVerifications;
    private Long approvedPeerVerifications;
}
