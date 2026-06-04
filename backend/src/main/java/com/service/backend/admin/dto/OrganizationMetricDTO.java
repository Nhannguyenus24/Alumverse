package com.service.backend.admin.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OrganizationMetricDTO {
    private Integer organizationId;
    private String organizationName;
    private long memberCount;
    private long eventCount;
    private long jobCount;
    private long fundraisingCount;
}
