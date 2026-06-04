package com.service.backend.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.List;

@Data
@AllArgsConstructor
public class OrganizationComparisonDTO {
    private List<OrganizationMetricDTO> organizations;
}
