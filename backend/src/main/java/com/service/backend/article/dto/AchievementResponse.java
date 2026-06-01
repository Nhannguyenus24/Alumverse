package com.service.backend.article.dto;

import com.service.backend.shared.entity.Achievement;
import com.service.backend.shared.enums.Status;
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
    private String topic;
    private Status status;

    public static AchievementResponse from(Achievement achievement) {
        return AchievementResponse.builder()
                .id(achievement.getId())
                .memberId(achievement.getMemberId())
                .title(achievement.getTitle())
                .description(achievement.getDescription())
                .imageUrl(achievement.getImageUrl())
                .awardedDate(achievement.getAwardedDate())
                .topic(achievement.getTopic())
                .status(achievement.getStatus())
                .build();
    }
}
