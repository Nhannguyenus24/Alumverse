package com.service.backend.admin.dto;

import lombok.Builder;
import lombok.Data;
import java.util.Map;

@Data
@Builder
public class SystemHealthDTO {
    private double apiErrorRate;
    private long activeJobsCount;
    private String storageUsed;
    private Map<String, String> jobStatus;
}
