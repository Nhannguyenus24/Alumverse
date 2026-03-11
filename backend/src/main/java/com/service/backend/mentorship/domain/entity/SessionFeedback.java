package com.service.backend.mentorship.domain.entity;

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
@Table("session_feedbacks")
public class SessionFeedback {

    @Id
    private Integer id;

    @Column("session_id")
    private Integer sessionId;

    @Column("mentee_member_id")
    private Integer menteeMemberId;

    private Integer rating;

    private String comment;

    @Column("is_public")
    @Builder.Default
    private Boolean isPublic = true;

    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;
}
