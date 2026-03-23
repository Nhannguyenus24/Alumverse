package com.service.backend.article.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.validator.constraints.URL;

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
    private String imageUrl;

    private LocalDate awardedDate;

    @Size(max = 50)
    private String status;
}
