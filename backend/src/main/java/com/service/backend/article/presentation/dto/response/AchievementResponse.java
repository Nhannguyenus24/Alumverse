package com.service.backend.article.presentation.dto.response;

import com.service.backend.article.domain.entity.Achievement;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AchievementResponse {

    private Integer id;
    private Integer memberId;
    private String title;
    private String description;
    private String imageUrl;
    private LocalDate awardedDate;
    private String status;

    public static AchievementResponse from(Achievement achievement) {
        return AchievementResponse.builder()
                .id(achievement.getId())
                .memberId(achievement.getMemberId())
                .title(achievement.getTitle())
                .description(achievement.getDescription())
                .imageUrl(achievement.getImageUrl())
                .awardedDate(achievement.getAwardedDate())
                .status(achievement.getStatus())
                .build();
    }
}
