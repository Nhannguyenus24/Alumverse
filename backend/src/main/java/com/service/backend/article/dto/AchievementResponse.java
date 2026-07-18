package com.service.backend.article.dto;

import com.service.backend.shared.entity.Achievement;
import com.service.backend.article.dto.AchievementDetailDTO;
import com.service.backend.shared.enums.Status;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AchievementResponse {

    private Integer id;
    private Integer organizationId;
    private Integer memberId;
    private String title;
    private String description;
    private String imageUrl;
    private String url;
    private LocalDate awardedDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String topic;
    private Status status;

    private String memberName;
    private String memberAvatar;
    private String memberJobTitle;
    private String memberCompany;
    private String submitterName;
    private String submitterRole;
    private Boolean userSubmitted;

    public static AchievementResponse from(Achievement achievement) {
        return AchievementResponse.builder()
                .id(achievement.getId())
                .organizationId(achievement.getOrganizationId())
                .memberId(achievement.getMemberId())
                .title(achievement.getTitle())
                .description(achievement.getDescription())
                .imageUrl(achievement.getImageUrl())
                .url(achievement.getUrl())
                .awardedDate(achievement.getAwardedDate())
                .createdAt(achievement.getCreatedAt())
                .updatedAt(achievement.getUpdatedAt())
                .topic(achievement.getTopic())
                .status(achievement.getStatus())
                .build();
    }

    public static AchievementResponse from(AchievementDetailDTO dto) {
        return AchievementResponse.builder()
                .id(dto.getId())
                .organizationId(dto.getOrganizationId())
                .memberId(dto.getMemberId())
                .title(dto.getTitle())
                .description(dto.getDescription())
                .imageUrl(dto.getImageUrl())
                .url(dto.getUrl())
                .awardedDate(dto.getAwardedDate())
                .createdAt(dto.getCreatedAt())
                .updatedAt(dto.getUpdatedAt())
                .topic(dto.getTopic())
                .status(dto.getStatus())
                .memberName(dto.getMemberName())
                .memberAvatar(dto.getMemberAvatar())
                .memberJobTitle(dto.getMemberJobTitle())
                .memberCompany(dto.getMemberCompany())
                .build();
    }
}
