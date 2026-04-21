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
public class UpdateAlumniPostRequest {

    @NotBlank
    @Size(min = 3, max = 255)
    private String title;

    @Size(max = 255)
    private String slug;

    @NotBlank
    private String content;

    @URL
    private String thumbnailUrl;

    /** Optional base64-encoded image. When present, backend uploads and replaces thumbnailUrl. */
    private String thumbnailBase64;
}
