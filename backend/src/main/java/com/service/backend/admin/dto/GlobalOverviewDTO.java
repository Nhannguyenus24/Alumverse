package com.service.backend.admin.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class GlobalOverviewDTO {
    private long activeOrganizations;
    private long totalMemberships;
    private long level1Accounts;
    private long level2Accounts;
    private long newMembershipsThisMonth;
}
