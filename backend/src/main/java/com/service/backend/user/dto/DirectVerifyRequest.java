package com.service.backend.user.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DirectVerifyRequest {
    @NotNull
    private Integer organizationId;
    @NotNull
    private Integer targetUserId;
}
