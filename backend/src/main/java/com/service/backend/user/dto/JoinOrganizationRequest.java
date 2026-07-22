package com.service.backend.user.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.Data;

@Data
public class JoinOrganizationRequest {

    @NotNull(message = "Organization ID is required")
    @Min(value = 1, message = "Organization ID must be greater than 0")
    @NotNull

    @Min(value = 1)

    private Integer organizationId;

    @Size(max = 255)


    private String studentId;

    @Size(max = 100)


    private List<String> startedYear;

    @Size(max = 100)


    private List<Integer> graduatedYear;

    @Size(max = 100)


    private List<String> graduationStatus;

    @Size(max = 100)


    private List<String> program;

    @Size(max = 100)


    private List<String> major;
}
