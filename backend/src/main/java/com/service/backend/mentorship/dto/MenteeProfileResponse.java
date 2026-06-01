package com.service.backend.mentorship.dto;

import com.service.backend.shared.entity.MenteeProfile;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MenteeProfileResponse {

    private Integer memberId;
    private String mentoringGoal;
    private String major;
    private String academicYear;
    private String interests;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static MenteeProfileResponse from(MenteeProfile profile) {
        return MenteeProfileResponse.builder()
                .memberId(profile.getMemberId())
                .mentoringGoal(profile.getMentoringGoal())
                .major(profile.getMajor())
                .academicYear(profile.getAcademicYear())
                .interests(profile.getInterests())
                .isActive(profile.getIsActive())
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }
}
