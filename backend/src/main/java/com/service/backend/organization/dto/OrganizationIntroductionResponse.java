package com.service.backend.organization.dto;

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
}
