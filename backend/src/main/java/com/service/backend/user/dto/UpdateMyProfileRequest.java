package com.service.backend.user.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.Data;

@Data
public class UpdateMyProfileRequest {

    private String phone;

    private String gender;

    @NotNull(message = "Organization ID is required")
    @Min(value = 1, message = "Organization ID must be greater than 0")
    private Integer organizationId;

    private List<String> program;

    private List<Integer> graduatedYear;

    private List<String> graduationStatus;

    private List<String> major;
}
