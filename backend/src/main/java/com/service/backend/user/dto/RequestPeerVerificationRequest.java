package com.service.backend.user.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RequestPeerVerificationRequest {
    @NotNull
    private Integer organizationId;
    @NotNull
    private Integer verifierUserId;
}
