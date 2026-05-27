package com.service.backend.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventStatisticsDTO {

    private Long totalEvents;
    private Long publishedEvents;
    private Long unpublishedEvents;
    private Long upcomingEvents;
    private Long ongoingEvents;
    private Long pastEvents;
    private Long newEventsToday;

    private Long totalTickets;
    private Long registeredTickets;
    private Long checkedInTickets;
    private Long cancelledTickets;
    private Long totalInterests;

    private List<EventSummary> topEventsByRegistration;
    private List<EventSummary> topEventsByInterest;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EventSummary {
        private Long eventId;
        private Long organizationId;
        private String title;
        private String location;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private Integer interestedCount;
        private Long registeredCount;
        private Boolean isPublished;
    }
}
