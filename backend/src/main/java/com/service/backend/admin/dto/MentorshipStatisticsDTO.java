package com.service.backend.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentorshipStatisticsDTO {

    private Long totalSessions;
    private Long pendingSessions;
    private Long confirmedSessions;
    private Long completedSessions;
    private Long cancelledSessions;
    private Long rejectedSessions;

    private Long totalMentors;
    private Long approvedMentors;
    private Long pendingMentors;

    private Long totalAvailabilities;
    private Long totalFeedbacks;
}
