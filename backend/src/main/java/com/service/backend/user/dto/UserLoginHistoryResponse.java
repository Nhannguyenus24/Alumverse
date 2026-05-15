package com.service.backend.user.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserLoginHistoryResponse {
    private Long id;
    private LocalDateTime loginAt;
    private String loginMethod;
    private String loginIp;
    private String userAgent;
}
