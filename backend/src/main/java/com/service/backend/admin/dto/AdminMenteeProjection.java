package com.service.backend.admin.dto;

import lombok.Data;
import org.springframework.data.relational.core.mapping.Column;

import java.time.LocalDateTime;

@Data
public class AdminMenteeProjection {

    @Column("member_id")
    private Integer memberId;

    @Column("full_name")
    private String fullName;

    private String email;

    private String status;

    @Column("total_sessions")
    private Long totalSessions;

    @Column("completed_sessions")
    private Long completedSessions;

    @Column("last_session_at")
    private LocalDateTime lastSessionAt;
}
