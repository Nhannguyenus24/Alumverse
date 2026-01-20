package com.service.common.entity;

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
    private Long id;

    @Column("session_id")
    private Long sessionId;

    @Column("mentee_member_id")
    private Long menteeMemberId;

    private Integer rating;

    private String comment;

    @Column("is_public")
    private Boolean isPublic;

    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;
}
