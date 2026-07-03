package com.service.backend.organization.dto;

import java.time.LocalDateTime;
import java.util.Map;

import com.service.backend.shared.entity.OrganizationSiteSettings;
import com.service.backend.shared.utils.JsonUtils;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationSiteSettingsResponse {
    private Integer organizationId;
    private String contactOffice;
    private String contactAddress;
    private String contactEmail;
    private String contactPhone;
    private String contactAdmissionsPhone;
    private Map<String, Object> socialLinks;
    private LocalDateTime updatedAt;

    public static OrganizationSiteSettingsResponse from(OrganizationSiteSettings settings) {
        return OrganizationSiteSettingsResponse.builder()
                .organizationId(settings.getOrganizationId())
                .contactOffice(settings.getContactOffice())
                .contactAddress(settings.getContactAddress())
                .contactEmail(settings.getContactEmail())
                .contactPhone(settings.getContactPhone())
                .contactAdmissionsPhone(settings.getContactAdmissionsPhone())
                .socialLinks(JsonUtils.fromJsonToMap(settings.getSocialLinks()))
                .updatedAt(settings.getUpdatedAt())
                .build();
    }

    public static OrganizationSiteSettingsResponse empty(Integer organizationId) {
        return OrganizationSiteSettingsResponse.builder()
                .organizationId(organizationId)
                .socialLinks(Map.of())
                .build();
    }
}
