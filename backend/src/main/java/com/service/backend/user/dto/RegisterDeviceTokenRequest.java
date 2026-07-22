package com.service.backend.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RegisterDeviceTokenRequest {

    @NotBlank
    private String fcmToken;

    private String platform;
}
