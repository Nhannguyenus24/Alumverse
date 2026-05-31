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
public class PendingPeerVerificationResponse {
    private Integer requestId;
    private Integer requesterUserId;
    private String requesterName;
    private Integer organizationId;
    private LocalDateTime createdAt;
}
