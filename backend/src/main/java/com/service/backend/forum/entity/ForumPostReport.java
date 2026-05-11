package com.service.backend.forum.entity;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table("forum_post_reports")
public class ForumPostReport {
    @Id
    private Long id;

    @Column("post_id")
    private Integer postId;

    @Column("reporter_member_id")
    private Integer reporterMemberId;

    private String reason;

    private String description;

    private String status;

    @Column("reviewed_by_user_id")
    private Integer reviewedByUserId;

    @Column("review_note")
    private String reviewNote;

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("updated_at")
    private LocalDateTime updatedAt;
}
