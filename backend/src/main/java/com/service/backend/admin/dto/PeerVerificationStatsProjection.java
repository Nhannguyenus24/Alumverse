package com.service.backend.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PeerVerificationStatsProjection {
    private Long totalVerifications;
    private Long pendingVerifications;
    private Long approvedVerifications;
}
