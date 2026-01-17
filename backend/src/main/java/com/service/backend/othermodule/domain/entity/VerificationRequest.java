package com.service.backend.othermodule.domain.entity;

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
@Table("verification_requests")
public class VerificationRequest {

    @Id
    private Long id;

    @Column("member_id")
    private Long memberId;

    @Column("document_url")
    private String documentUrl;

    @Column("document_type")
    private String documentType;

    private String status;

    @Column("admin_note")
    private String adminNote;

    @Column("reviewed_by_member_id")
    private Long reviewedByMemberId;

    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;
}
