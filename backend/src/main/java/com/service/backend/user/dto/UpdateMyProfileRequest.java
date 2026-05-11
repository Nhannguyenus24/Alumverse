package com.service.backend.user.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateMyProfileRequest {

    private String phone;

    private String gender;

    @NotNull(message = "Organization ID is required")
    @Min(value = 1, message = "Organization ID must be greater than 0")
    private Integer organizationId;

    private String program;

    private Integer graduatedYear;

    private String graduationStatus;

    private String major;
}
