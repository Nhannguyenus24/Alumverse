package com.service.backend.eventmodule.presentation.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventStatisticsResponse {

    private Long eventId;
    private Integer interestedCount;
    private Long registeredCount;
    private Long checkedInCount;
    private Integer maxCapacity;
    private Long availableSlots;
}
