package com.service.backend.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.Map;
import java.util.List;

@Data
@AllArgsConstructor
public class FeatureUsageDTO {
    private Map<String, Long> featureEnablementCount;
    private Map<Integer, List<String>> organizationFeatures;
}
