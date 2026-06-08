package com.service.backend.article.dto;

import com.service.backend.shared.entity.Achievement;
import com.service.backend.article.dto.AchievementDetailDTO;
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

    private String memberName;
    private String memberAvatar;
    private String memberJobTitle;
    private String memberCompany;

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

    public static AchievementResponse from(AchievementDetailDTO dto) {
        return AchievementResponse.builder()
                .id(dto.getId())
                .memberId(dto.getMemberId())
                .title(dto.getTitle())
                .description(dto.getDescription())
                .imageUrl(dto.getImageUrl())
                .awardedDate(dto.getAwardedDate())
                .topic(dto.getTopic())
                .status(dto.getStatus())
                .memberName(dto.getMemberName())
                .memberAvatar(dto.getMemberAvatar())
                .memberJobTitle(dto.getMemberJobTitle())
                .memberCompany(dto.getMemberCompany())
                .build();
    }
}
