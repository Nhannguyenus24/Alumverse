package com.service.backend.mentorship.dto;

import com.service.backend.mentorship.entity.MentorProfile;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentorProfileResponse {

    private Integer memberId;
    private String currentJobTitle;
    private String currentCompany;
    private String bio;
    private BigDecimal ratingAvg;
    private Integer totalSessions;
    private String status;
    private String reviewNote;
    private LocalDateTime reviewedAt;
    private String coverUrl;
    private String defaultMeetingLink;
    private String bookingWindowSettings;
    private String extendedProfile;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private String fullName;
    private String avatarUrl;

    private List<String> expertiseTopics;

    public static MentorProfileResponse from(MentorProfile profile) {
        return MentorProfileResponse.builder()
                .memberId(profile.getMemberId())
                .currentJobTitle(profile.getCurrentJobTitle())
                .currentCompany(profile.getCurrentCompany())
                .bio(profile.getBio())
                .ratingAvg(profile.getRatingAvg())
                .totalSessions(profile.getTotalSessions())
                .status(profile.getStatus())
                .reviewNote(profile.getReviewNote())
                .reviewedAt(profile.getReviewedAt())
                .coverUrl(profile.getCoverUrl())
                .defaultMeetingLink(profile.getDefaultMeetingLink())
                .bookingWindowSettings(profile.getBookingWindowSettings())
                .extendedProfile(profile.getExtendedProfile())
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }

    public MentorProfileResponse withDisplay(String fullName, String avatarUrl) {
        this.fullName = fullName;
        this.avatarUrl = avatarUrl;
        return this;
    }
}
