package com.service.backend.shared.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("mentorship_reports")
public class MentorshipReport {

    @Id
    private Integer id;

    @Column("session_id")
    private Integer sessionId;

    @Column("reporter_member_id")
    private Integer reporterMemberId;

    @Column("reported_member_id")
    private Integer reportedMemberId;

    @Column("reason_category")
    private String reasonCategory;

    private String description;

    private String status;

    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;
}
