package com.service.backend.mentorship.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentorshipHubStatsResponse {
    private Integer totalMentorsCount;
    private Integer totalSessionsCount;
    private Integer confirmedAlumniCount;
    private Integer upcomingSessionsCount;
    private List<UpcomingSessionDto> upcomingSessions;
    private List<ConfirmedAlumniDto> confirmedAlumni;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpcomingSessionDto {
        private Integer sessionId;
        private String mentorName;
        private String menteeName;
        private java.time.LocalDateTime sessionTime;
        private String status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConfirmedAlumniDto {
        private Integer memberId;
        private String fullName;
        private String avatarUrl;
        private String currentJobTitle;
        private String currentCompany;
    }
}
