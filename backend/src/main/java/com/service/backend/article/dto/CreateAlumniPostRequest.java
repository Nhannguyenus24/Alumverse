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
public class CreateAlumniPostRequest {

    @NotBlank
    @Size(min = 3, max = 255)
    private String title;

    @Size(max = 255)
    private String slug;

    @NotBlank
    private String content;

    @URL
    private String thumbnailUrl;

    /** Optional base64-encoded image. When present, backend uploads and stores the resulting URL. */
    private String thumbnailBase64;

    private String topic;
}
