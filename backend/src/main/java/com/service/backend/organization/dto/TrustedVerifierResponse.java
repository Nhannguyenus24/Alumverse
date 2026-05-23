package com.service.backend.organization.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrustedVerifierResponse {
    private Integer userId;
    private String fullName;
    private String userName;
    private String avatarUrl;
    private String email;
    private String major;
    private String program;
}
