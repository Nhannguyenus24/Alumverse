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
public class CreateNewsRequest {

    private Integer organizationId;

    @NotBlank
    @Size(min = 3, max = 255)
    private String title;

    @Size(max = 255)
    private String slug;

    @NotBlank
    private String content;

    /** Base64-encoded thumbnail. When present, the backend converts it to WebP and stores it. */
    private String thumbnailBase64;

    private String topic;

    /** Optional proof/source link for the post. */
    @URL
    private String url;
}
