package com.service.backend.mentorship.dto;

import com.service.backend.shared.entity.MentorAvailability;
import com.service.backend.shared.entity.MentorshipSession;
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
    private String sessionType;
    private String introduction;
    private String description;
    private String cvUrl;
    private String cancelReason;
    private LocalDateTime proposedStartTime;
    private LocalDateTime proposedEndTime;
    private LocalDateTime mentorJoinedAt;
    private LocalDateTime menteeJoinedAt;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private LocalDateTime createdAt;

    // ===== Enriched from mentor_availabilities (optional, populated when looked up) =====
    private Integer mentorMemberId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;

    // ===== Enriched display fields (joined from users) =====
    private String mentorName;
    private String mentorAvatarUrl;
    private String menteeName;
    private String menteeAvatarUrl;

    // ===== Feedback state (mentee booking view) =====
    private Boolean hasFeedback;
    private Integer feedbackId;

    public static MentorshipSessionResponse from(MentorshipSession session) {
        return MentorshipSessionResponse.builder()
                .id(session.getId())
                .availabilityId(session.getAvailabilityId())
                .menteeMemberId(session.getMenteeMemberId())
                .status(session.getStatus() != null ? session.getStatus().getValue() : null)
                .bookingNote(session.getBookingNote())
                .meetingLink(session.getMeetingLink())
                .sessionType(session.getSessionType() != null ? session.getSessionType().getValue() : null)
                .introduction(session.getIntroduction())
                .description(session.getDescription())
                .cvUrl(session.getCvUrl())
                .cancelReason(session.getCancelReason())
                .proposedStartTime(session.getProposedStartTime())
                .proposedEndTime(session.getProposedEndTime())
                .mentorJoinedAt(session.getMentorJoinedAt())
                .menteeJoinedAt(session.getMenteeJoinedAt())
                .startedAt(session.getStartedAt())
                .endedAt(session.getEndedAt())
                .createdAt(session.getCreatedAt())
                .build();
    }

    public static MentorshipSessionResponse from(MentorshipSession session, MentorAvailability availability) {
        MentorshipSessionResponse r = from(session);
        if (availability != null) {
            r.setMentorMemberId(availability.getMentorMemberId());
            r.setStartTime(availability.getStartTime());
            r.setEndTime(availability.getEndTime());
        }
        return r;
    }
}
