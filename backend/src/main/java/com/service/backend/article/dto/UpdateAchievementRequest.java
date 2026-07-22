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
public class UpdateAchievementRequest {

    @NotBlank
    @Size(min = 3, max = 255)
    @Size(max = 255)

    private String title;

    @Size(max = 255)


    private String description;

    @URL
    @Size(max = 255)

    private String url;

    /** Base64-encoded image. When present it replaces the current image; when absent the existing image is kept. */
    @Size(max = 255)

    private String imageBase64;

    private LocalDate awardedDate;

    private Status status;

    @Size(max = 255)


    private String topic;
}
