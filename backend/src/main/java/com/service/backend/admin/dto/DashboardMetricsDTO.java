package com.service.backend.admin.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.Map;

@Data
public class DashboardMetricsDTO {
    private Long totalUsers;
    private Map<String, Long> newUsers; // keys like "7d","30d"
    private Long dailyActive;
    private Long totalOrganizations;
    private Long pendingVerifications;
    private Long totalEvents;
    private Long upcomingEvents;
    private Long ticketsSold;
    private Long totalDonationsCount;
    private BigDecimal donationsLast30Days;
}
