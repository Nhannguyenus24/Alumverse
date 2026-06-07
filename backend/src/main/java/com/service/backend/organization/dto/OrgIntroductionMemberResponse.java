package com.service.backend.organization.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrgIntroductionMemberResponse {
    @NotBlank(message = "Member name is required")
    private String name;
    private String positions;
    private String email;
    private String image;
    private String content;
}
