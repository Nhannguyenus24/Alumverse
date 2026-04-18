package com.service.backend.admin.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MonthlyActivityDTO {
    private Integer year;
    private List<MonthData> months;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MonthData {
        private Integer month;
        private Long activeUsers;   // distinct users who posted this month
        private Long postCount;     // total posts created this month
        private Long topicCount;    // total topics created this month
    }
}
