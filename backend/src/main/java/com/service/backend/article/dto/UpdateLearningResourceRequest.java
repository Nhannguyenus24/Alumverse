package com.service.backend.article.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.validator.constraints.URL;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateLearningResourceRequest {

    @NotBlank
    @Size(min = 3, max = 255)
    @Size(max = 255)

    private String title;

    @Size(max = 50)
    @Size(max = 255)

    private String type;

    @URL
    @Size(max = 255)

    private String linkUrl;

    @Size(max = 255)


    private String description;

    /**
     * Base64-encoded thumbnail (optionally with a data URL header). When present it replaces the
     * current thumbnail; when absent the existing thumbnail is kept.
     */
    @Size(max = 255)

    private String thumbnailBase64;
}
