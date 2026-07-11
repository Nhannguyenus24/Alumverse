package com.service.backend.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserGrowthStatsProjection {
    private Long newUsers7Days;
    private Long newUsers30Days;
    private Long activeUsers;
    private Long bannedUsers;
    private Long deletedUsers;
}
