package com.service.backend.user.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;
import lombok.Data;

@Data
public class UpdateMyProfileRequest {

    private String fullName;

    private String phone;

    private String gender;

    private LocalDate dob;

    private String bio;

    private String currentJobTitle;

    private String currentCompany;

    private Object links;

    @NotNull(message = "Organization ID is required")
    @Min(value = 1, message = "Organization ID must be greater than 0")
    private Integer organizationId;

    private String studentId;

    private List<String> program;

    private List<String> startedYear;

    private List<Integer> graduatedYear;

    private List<String> graduationStatus;

    private List<String> major;

    private List<String> faculty;

    private List<String> department;
}
