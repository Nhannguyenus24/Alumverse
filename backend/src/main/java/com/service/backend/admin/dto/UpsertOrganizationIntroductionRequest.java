package com.service.backend.admin.dto;

import java.util.List;

import lombok.Data;

@Data
public class UpsertOrganizationIntroductionRequest {

    private String content;
    private List<String> images;
}
