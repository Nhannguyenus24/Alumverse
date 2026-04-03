package com.service.backend.mentorship.dto;

import com.service.backend.mentorship.entity.MentorshipSession;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentorshipSessionResponse {

    private Integer id;
    private Integer availabilityId;
    private Integer menteeMemberId;
    private String status;
    private String bookingNote;
    private String meetingLink;
    private LocalDateTime createdAt;

    public static MentorshipSessionResponse from(MentorshipSession session) {
        return MentorshipSessionResponse.builder()
                .id(session.getId())
                .availabilityId(session.getAvailabilityId())
                .menteeMemberId(session.getMenteeMemberId())
                .status(session.getStatus())
                .bookingNote(session.getBookingNote())
                .meetingLink(session.getMeetingLink())
                .createdAt(session.getCreatedAt())
                .build();
    }
}
