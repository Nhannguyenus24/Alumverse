package com.service.backend.mentorship.presentation.dto.response;

import com.service.backend.mentorship.domain.entity.MentorProfile;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

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
    private Boolean isApproved;
    private LocalDateTime createdAt;

    public static MentorProfileResponse from(MentorProfile profile) {
        return MentorProfileResponse.builder()
                .memberId(profile.getMemberId())
                .currentJobTitle(profile.getCurrentJobTitle())
                .currentCompany(profile.getCurrentCompany())
                .bio(profile.getBio())
                .ratingAvg(profile.getRatingAvg())
                .totalSessions(profile.getTotalSessions())
                .isApproved(profile.getIsApproved())
                .createdAt(profile.getCreatedAt())
                .build();
    }
}
