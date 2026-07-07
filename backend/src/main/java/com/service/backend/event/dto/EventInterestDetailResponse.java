package com.service.backend.event.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.service.backend.shared.entity.EventInterest;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class EventInterestDetailResponse {
    private Long id;
    private Long eventId;
    private Long memberId;
    private LocalDateTime createdAt;
    private String memberName;
    private String memberEmail;
    private String memberAvatarUrl;

    public static EventInterestDetailResponseBuilder fromInterest(EventInterest interest) {
        return EventInterestDetailResponse.builder()
                .id(interest.getId())
                .eventId(interest.getEventId())
                .memberId(interest.getMemberId())
                .createdAt(interest.getCreatedAt());
    }
}
