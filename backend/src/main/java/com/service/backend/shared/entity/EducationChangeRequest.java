package com.service.backend.shared.entity;

import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.service.backend.shared.enums.Status;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table("education_change_requests")
public class EducationChangeRequest {

    @Id
    private Integer id;

    @Column("member_id")
    private Integer memberId;

    @Column("organization_id")
    private Integer organizationId;

    @Column("old_data")
    private String oldData;

    @Column("new_data")
    private String newData;

    private Status status;

    @Column("admin_note")
    private String adminNote;

    @Column("reviewed_by_user_id")
    private Integer reviewedByUserId;

    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("reviewed_at")
    private LocalDateTime reviewedAt;
}
