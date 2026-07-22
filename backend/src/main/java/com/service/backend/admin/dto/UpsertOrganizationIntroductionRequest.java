package com.service.backend.admin.dto;

import java.util.List;

import com.service.backend.organization.dto.OrgIntroductionMemberResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpsertOrganizationIntroductionRequest {

    @Size(max = 255)


    private String content;
    
    @Size(max = 100)

    
    private List<String> images;
    
    @Size(max = 255)

    
    private String vision;
    
    @Size(max = 255)

    
    private String mission;
    
    @Size(max = 255)

    
    private String coreValues;
    
    @Size(max = 255)

    
    private String bannerUrl;
    
    @Valid
    @Size(max = 100)

    private List<OrgIntroductionMemberResponse> leaders;
    
    @Valid
    @Size(max = 100)

    private List<OrgIntroductionMemberResponse> teamMembers;
    
    @Size(max = 255)

    
    private String leadersContent;
    
    @Size(max = 255)

    
    private String teamMembersContent;
}
