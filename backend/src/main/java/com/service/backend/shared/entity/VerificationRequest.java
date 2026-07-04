package com.service.backend.shared.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import com.service.backend.shared.enums.DocumentType;
import com.service.backend.shared.enums.Status;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("verification_requests")
public class VerificationRequest {

    @Id
    private Integer id;

    @Column("organization_id")
    private Integer organizationId;

    @Column("member_id")
    private Integer memberId;

    @Column("document_url")
    private String documentUrl;

    @Column("document_type")
    private DocumentType documentType;

    @Column("ai_summary")
    private String aiSummary;

    @Column("status")
    private Status status;

    @Column("admin_note")
    private String adminNote;

    @Column("reviewed_by_member_id")
    private Integer reviewedByMemberId;

    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column("updated_at")
    private LocalDateTime updatedAt;
}
