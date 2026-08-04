package com.service.backend.admin.dto;

import org.springframework.data.relational.core.mapping.Column;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Data supplied to AI when it assists an administrator reviewing proof. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerificationRecommendationContext {
    @Column("request_id")
    private Integer requestId;
    @Column("member_id")
    private Integer memberId;
    @Column("organization_id")
    private Integer organizationId;
    @Column("full_name")
    private String fullName;
    @Column("student_id")
    private String studentId;
    @Column("declared_faculty")
    private String declaredFaculty;
    @Column("declared_program")
    private String declaredProgram;
    @Column("declared_major")
    private String declaredMajor;
    @Column("declared_started_year")
    private String declaredStartedYear;
    @Column("declared_graduated_year")
    private String declaredGraduatedYear;
    @Column("declared_graduation_status")
    private String declaredGraduationStatus;
    @Column("document_type")
    private String documentType;
    @Column("ocr_text")
    private String ocrText;
    /** Derived locally with accent/order-insensitive name token matching. */
    private Boolean normalizedNameMatch;
    /** Derived locally by exact digit comparison. */
    private Boolean studentIdMatch;
}
