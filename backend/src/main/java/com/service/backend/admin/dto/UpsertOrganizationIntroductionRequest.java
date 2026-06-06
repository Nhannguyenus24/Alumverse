package com.service.backend.admin.dto;

import java.util.List;

import lombok.Data;

@Data
public class UpsertOrganizationIntroductionRequest {

    private String content;
    private List<String> images;
    private String vision;
    private String mission;
    private String coreValues;
    private String bannerUrl;
    private List<String> leaders;
    private List<String> teamMembers;
    private String leadersContent;
    private String teamMembersContent;
}
