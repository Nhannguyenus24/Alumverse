package com.service.backend.organization.entity;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("school_feedbacks")
public class SchoolFeedback {

    @Id
    private Integer id;

    @Column("organization_id")
    private Integer organizationId;

    @Column("full_name")
    private String fullName;

    @Column("phone")
    private String phone;

    @Column("email")
    private String email;

    @Column("subject")
    private String subject;

    @Column("content")
    private String content;

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("is_read")
    private Boolean isRead;
}
