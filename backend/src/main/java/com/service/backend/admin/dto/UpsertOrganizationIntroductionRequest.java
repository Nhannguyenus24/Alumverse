package com.service.backend.admin.dto;

import java.util.List;

import com.service.backend.organization.dto.OrgIntroductionMemberResponse;
import jakarta.validation.Valid;
import lombok.Data;

@Data
public class UpsertOrganizationIntroductionRequest {

    private String content;
    
    private List<String> images;
    
    private String vision;
    
    private String mission;
    
    private String coreValues;
    
    private String bannerUrl;
    
    @Valid
    private List<OrgIntroductionMemberResponse> leaders;
    
    @Valid
    private List<OrgIntroductionMemberResponse> teamMembers;
    
    private String leadersContent;
    
    private String teamMembersContent;
}
