package com.service.backend.article.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.validator.constraints.URL;

import com.service.backend.shared.enums.Status;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateAchievementRequest {

    @NotBlank
    @Size(min = 3, max = 255)
    private String title;

    private String description;

    @URL
    private String url;

    /** Base64-encoded image. When present, the backend converts it to WebP and stores it. */
    private String imageBase64;

    private LocalDate awardedDate;

    private Status status;

    private String topic;
}
