package com.service.backend.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateOrganizationRequest {
    private String name;
    private String slug;
    private String logoUrl;
    private String status;
    private List<String> programs;
    private List<String> majors;
    private String featuresConfig;
}
