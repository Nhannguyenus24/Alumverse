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
public class CreateLearningResourceRequest {

    @NotBlank
    @Size(min = 3, max = 255)
    private String title;

    @Size(max = 50)
    private String type;

    @URL
    private String linkUrl;

    private String description;

    /** URL of an already-uploaded thumbnail (upload via /images/upload first). */
    @URL
    private String thumbnailUrl;
}
