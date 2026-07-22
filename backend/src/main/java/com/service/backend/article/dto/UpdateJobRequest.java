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

    @org.hibernate.validator.constraints.URL
    private String url;

    /** Base64-encoded thumbnail image. When present, the backend converts it to WebP and stores it; otherwise the existing thumbnail is kept. */
    private String thumbnailBase64;

    private LocalDate deadline;

    private Boolean isReferral;
}
