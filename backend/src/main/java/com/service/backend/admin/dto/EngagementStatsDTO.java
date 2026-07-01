package com.service.backend.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Engagement & retention metrics derived from {@code user_login_histories}.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EngagementStatsDTO {
    private Long dailyActiveUsers;    // distinct users, last 24h
    private Long weeklyActiveUsers;   // distinct users, last 7d
    private Long monthlyActiveUsers;  // distinct users, last 30d
    private Double stickiness;        // DAU / MAU * 100

    private List<StatPoint> loginsByHour;   // 0..23 -> count (last 30d)
    private List<StatPoint> loginsByMethod; // method -> count
    private List<StatPoint> dailyLogins;    // date -> count (last 30d)
}
