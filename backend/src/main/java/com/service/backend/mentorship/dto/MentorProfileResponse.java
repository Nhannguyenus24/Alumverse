package com.service.backend.mentorship.dto;

import com.service.backend.shared.entity.MentorProfile;
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

    private BigDecimal ratingAvg;
    private Integer totalSessions;
    private String status;
    private String reviewNote;
    private LocalDateTime reviewedAt;
    private String defaultMeetingLink;
    private String bookingWindowSettings;
    private String extendedProfile;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private String fullName;
    private String avatarUrl;
    private String coverUrl;

    private List<String> expertiseTopics;

    /** Priority-ordered normalized skill tags from the skills catalog (mentor_skills). */
    private List<String> expertiseTags;

    public static MentorProfileResponse from(MentorProfile profile) {
        return MentorProfileResponse.builder()
                .memberId(profile.getMemberId())
                .currentJobTitle(profile.getCurrentJobTitle())
                .currentCompany(profile.getCurrentCompany())

                .ratingAvg(profile.getRatingAvg())
                .totalSessions(profile.getTotalSessions())
                .status(profile.getStatus() != null ? profile.getStatus().getValue() : null)
                .reviewNote(profile.getReviewNote())
                .reviewedAt(profile.getReviewedAt())
                .defaultMeetingLink(profile.getDefaultMeetingLink())
                .bookingWindowSettings(profile.getBookingWindowSettings())
                .extendedProfile(profile.getExtendedProfile())
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }

    public MentorProfileResponse withDisplay(String fullName, String avatarUrl, String coverUrl,
                                             String currentJobTitle, String currentCompany) {
        this.fullName = fullName;
        this.avatarUrl = avatarUrl;
        this.coverUrl = coverUrl;
        if (currentJobTitle != null && !currentJobTitle.isBlank()) {
            this.currentJobTitle = currentJobTitle;
        }
        if (currentCompany != null && !currentCompany.isBlank()) {
            this.currentCompany = currentCompany;
        }
        return this;
    }

    /** Strips booking-sensitive fields for level-1 preview browse. */
    public MentorProfileResponse asPreview() {
        this.defaultMeetingLink = null;
        this.bookingWindowSettings = null;
        this.extendedProfile = null;
        this.reviewNote = null;
        this.reviewedAt = null;

        return this;
    }
}
