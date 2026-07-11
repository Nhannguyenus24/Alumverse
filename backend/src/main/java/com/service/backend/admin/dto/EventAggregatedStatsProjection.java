package com.service.backend.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventAggregatedStatsProjection {
    private Long totalEvents;
    private Long publishedEvents;
    private Long unpublishedEvents;
    private Long upcomingEvents;
    private Long ongoingEvents;
    private Long pastEvents;
    private Long newEventsToday;
}
