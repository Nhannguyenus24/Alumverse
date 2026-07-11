package com.service.backend.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventTicketAggregatedStatsProjection {
    private Long totalTickets;
    private Long registeredTickets;
    private Long checkedInTickets;
    private Long cancelledTickets;
}
