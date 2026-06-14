package com.service.backend.admin.dto;

import com.service.backend.shared.enums.DocumentType;
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

    private String email;

    @Column("user_name")
    private String userName;

    @Column("document_url")
    private String documentUrl;

    @Column("document_type")
    private DocumentType documentType;

    @Column("ai_summary")
    private String aiSummary;

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
