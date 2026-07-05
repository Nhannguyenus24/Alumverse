package com.service.backend.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginHistoryResponse {
    private Long id;
    private Integer userId;
    private String email;
    private LocalDateTime loginAt;
    private String loginMethod;
    private String loginIp;
    private String userAgent;
}
