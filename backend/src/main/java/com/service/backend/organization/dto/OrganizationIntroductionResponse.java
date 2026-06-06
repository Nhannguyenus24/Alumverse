package com.service.backend.organization.dto;

import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationIntroductionResponse {

    private Integer orgaId;
    private String content;
    private List<String> imageUrls;
    private String vision;
    private String mission;
    private String coreValues;
    private String bannerUrl;
    private List<OrgIntroductionMemberResponse> leaders;
    private List<OrgIntroductionMemberResponse> teamMembers;
    private String leadersContent;
    private String teamMembersContent;
    private LocalDateTime updatedAt;
}
