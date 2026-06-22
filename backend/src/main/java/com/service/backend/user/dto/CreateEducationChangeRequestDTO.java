package com.service.backend.user.dto;

import java.util.List;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateEducationChangeRequestDTO {

    @NotNull
    private Integer organizationId;

    private List<String> program;
    private List<String> major;
    private List<String> faculty;
    private List<String> department;
    private List<String> startedYear;
    private List<String> graduatedYear;
    private List<String> graduationStatus;
}
