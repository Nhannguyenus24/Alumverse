package com.service.backend.admin.dto;

import lombok.Builder;
import lombok.Data;
import lombok.AllArgsConstructor;
import java.util.Map;
import java.util.List;

@Data
@Builder
public class ModerationSummaryDTO {
    private Map<String, Long> reportsByType;
    private double averageResolutionTimeHours;
    private List<FlaggedOrganizationDTO> flaggedOrganizations;

    @Data
    @AllArgsConstructor
    public static class FlaggedOrganizationDTO {
        private Integer organizationId;
        private String organizationName;
        private long reportCount;
    }
}
