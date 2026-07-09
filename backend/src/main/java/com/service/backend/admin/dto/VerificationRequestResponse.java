package com.service.backend.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.relational.core.mapping.Column;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerificationRequestResponse {
    private Integer id;

    @Column("member_id")
    private Integer memberId;

    @Column("organization_id")
    private Integer organizationId;

    @Column("request_type")
    private String requestType;

    @Column("full_name")
    private String fullName;

    @Column("avatar_url")
    private String avatarUrl;

    private String email;

    @Column("student_id")
    private String studentId;

    @Column("document_url")
    private String documentUrl;

    @Column("document_type")
    private String documentType;

    @Column("ai_summary")
    private String aiSummary;

    @Column("evidence_summary")
    private String evidenceSummary;

    @Column("confirmed_verifiers")
    private String confirmedVerifiers;

    @Column("pending_verifiers")
    private String pendingVerifiers;

    private String status;

    @Column("admin_note")
    private String adminNote;

    @Column("reviewed_by_member_id")
    private Integer reviewedByMemberId;

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("updated_at")
    private LocalDateTime updatedAt;
}
