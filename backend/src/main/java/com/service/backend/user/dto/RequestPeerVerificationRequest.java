package com.service.backend.user.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class RequestPeerVerificationRequest {
    @NotNull
    @NotNull

    @Min(value = 1)

    private Integer organizationId;
    @NotNull
    @NotNull

    @Min(value = 1)

    private Integer verifierUserId;
}
