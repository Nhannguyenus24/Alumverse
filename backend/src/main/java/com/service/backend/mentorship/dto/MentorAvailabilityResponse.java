package com.service.backend.mentorship.dto;

import com.service.backend.mentorship.entity.MentorAvailability;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentorAvailabilityResponse {

    private Integer id;
    private Integer mentorMemberId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String status;

    public static MentorAvailabilityResponse from(MentorAvailability availability) {
        return MentorAvailabilityResponse.builder()
                .id(availability.getId())
                .mentorMemberId(availability.getMentorMemberId())
                .startTime(availability.getStartTime())
                .endTime(availability.getEndTime())
                .status(availability.getStatus())
                .build();
    }
}
