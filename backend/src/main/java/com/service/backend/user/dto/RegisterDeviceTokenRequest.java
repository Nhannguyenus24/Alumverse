package com.service.backend.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterDeviceTokenRequest {

    @NotBlank
    @Size(max = 255)

    private String fcmToken;

    @Size(max = 255)


    private String platform;
}
