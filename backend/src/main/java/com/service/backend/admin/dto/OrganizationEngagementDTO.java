package com.service.backend.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrganizationEngagementDTO {
    private Integer organizationId;
    private String organizationName;
    private Long totalMembers;
    private Long activeForumUsers;
}
