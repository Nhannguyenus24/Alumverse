package com.service.backend.admin.dto;

import java.util.List;

import com.service.backend.shared.entity.AdminAuditLog;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserActivityResponse {
    private List<LoginHistoryResponse> loginHistories;
    private List<Object> verificationRequests;
    private List<AdminAuditLog> adminActions;
}
