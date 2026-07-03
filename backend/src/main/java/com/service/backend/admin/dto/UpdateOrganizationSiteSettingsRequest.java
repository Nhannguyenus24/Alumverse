package com.service.backend.admin.dto;

import java.util.Map;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateOrganizationSiteSettingsRequest {
    @Size(max = 255)
    private String contactOffice;

    @Size(max = 1000)
    private String contactAddress;

    @Email
    @Size(max = 255)
    private String contactEmail;

    @Size(max = 50)
    private String contactPhone;

    @Size(max = 50)
    private String contactAdmissionsPhone;

    private Map<String, Object> socialLinks;
}
