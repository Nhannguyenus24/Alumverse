package com.service.backend.mentorship.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateExpertiseRequest {

    @NotBlank
    @Size(min = 1, max = 255)
    private String topic;

    @Min(0)
    private Integer yearsExperience;

    @Size(max = 2000)
    private String description;

    @Pattern(regexp = "CAREER|ACADEMIC|SOFT_SKILLS|GENERAL",
            message = "category must be one of: CAREER, ACADEMIC, SOFT_SKILLS, GENERAL")
    private String category;

    @Size(max = 100)
    private String tag;
}
