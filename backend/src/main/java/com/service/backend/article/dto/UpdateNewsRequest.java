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
public class UpdateNewsRequest {

    @NotBlank
    @Size(min = 3, max = 255)
    @Size(max = 255)

    private String title;

    @Size(max = 255)
    @Size(max = 255)

    private String slug;

    @NotBlank
    @Size(max = 255)

    private String content;

    /** Base64-encoded thumbnail. When present it replaces the current image; when absent the existing image is kept. */
    @Size(max = 255)

    private String thumbnailBase64;

    @Size(max = 255)


    private String topic;

    /** Optional proof/source link for the post. */
    @URL
    @Size(max = 255)

    private String url;
}
