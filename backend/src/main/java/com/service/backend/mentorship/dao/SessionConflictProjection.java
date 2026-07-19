package com.service.backend.mentorship.dao;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.relational.core.mapping.Column;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionConflictProjection {

    @Column("session_id")
    private Integer sessionId;

    @Column("mentor_member_id")
    private Integer mentorMemberId;

    @Column("mentor_name")
    private String mentorName;

    @Column("start_time")
    private LocalDateTime startTime;

    @Column("end_time")
    private LocalDateTime endTime;
}
