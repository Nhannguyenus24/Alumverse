package com.service.backend.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Aggregated "platform health" insights: chat/messaging activity,
 * cross-organization comparison and service-quality (ratings / reports).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformStatsDTO {
    private ChatStats chat;
    private List<OrgComparison> orgComparison;
    private QualityStats quality;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatStats {
        private Long totalMessages;
        private Long totalGroups;
        private Long totalBlocks;
        private List<StatPoint> groupsByType;
        private List<StatPoint> messagesByDay;
        private List<StatPoint> requestsByStatus;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrgComparison {
        private String name;
        private Long members;
        private Long events;
        private Long topics;
        private Long jobs;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QualityStats {
        private Double avgSessionRating;
        private List<StatPoint> ratingDistribution;
        private List<StatPoint> mentorReportsByStatus;
        private List<StatPoint> forumReportsByStatus;
    }
}
