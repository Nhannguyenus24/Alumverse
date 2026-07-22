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
public class UpdateJobRequest {

    @NotBlank
    @Size(min = 3, max = 255)
    @Size(max = 255)

    private String title;

    @Size(max = 255)


    private String description;

    @Size(max = 255)
    @Size(max = 255)

    private String companyName;

    @Size(max = 255)
    @Size(max = 255)

    private String location;

    @Size(max = 50)
    @Size(max = 255)

    private String type;

    @Size(max = 100)
    @Size(max = 255)

    private String salaryRange;

    @Size(max = 255)


    private String howToApply;

    @org.hibernate.validator.constraints.URL
    @Size(max = 255)

    private String url;

    private LocalDate deadline;

    private Boolean isReferral;
}
