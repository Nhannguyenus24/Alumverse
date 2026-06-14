package com.service.backend.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackStatisticsDTO {

    private Long totalFeedbacks;
    private Long unreadFeedbacks;
    private Long readFeedbacks;
    private List<DayCount> feedbackTimeline;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DayCount {
        private String date;
        private Long count;
    }
}
