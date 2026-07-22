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
public class UserGrowthStatisticsDTO {

    private Long newUsersToday;
    private Long newUsersLast7Days;
    private Long newUsersLast30Days;
    private Long totalActiveUsers;
    private Long totalBannedUsers;
    private Long totalDeletedUsers;
    private List<DayCount> dailyRegistrations;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DayCount {
        private String date;
        private Long count;
    }
}
