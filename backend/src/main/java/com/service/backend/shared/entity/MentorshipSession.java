package com.service.backend.shared.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import com.service.backend.shared.enums.Status;
import com.service.backend.shared.enums.MentorshipSessionType;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("mentorship_sessions")
public class MentorshipSession {

    @Id
    private Integer id;

    @Column("availability_id")
    private Integer availabilityId;

    @Column("mentee_member_id")
    private Integer menteeMemberId;

    private Status status;

    @Column("booking_note")
    private String bookingNote;

    @Column("meeting_link")
    private String meetingLink;

    @Column("session_type")
    private MentorshipSessionType sessionType;

    private String introduction;

    private String description;

    @Column("cv_url")
    private String cvUrl;

    @Column("cancel_reason")
    private String cancelReason;

    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;
}
