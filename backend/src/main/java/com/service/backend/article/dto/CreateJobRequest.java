package com.service.backend.article.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateJobRequest {

    @NotBlank
    @Size(min = 3, max = 255)
    private String title;

    private String description;

    @Size(max = 255)
    private String companyName;

    @Size(max = 255)
    private String location;

    @Size(max = 50)
    private String type;

    @Size(max = 100)
    private String salaryRange;

    private String howToApply;

    private LocalDate deadline;

    private Boolean isReferral;
}
