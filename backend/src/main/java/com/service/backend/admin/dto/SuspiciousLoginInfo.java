package com.service.backend.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SuspiciousLoginInfo {
    private Integer userId;
    private String email;
    private String userName;
    private Long distinctIpCount;
    private Long totalLogins;
}
