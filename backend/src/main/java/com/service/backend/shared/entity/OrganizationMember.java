package com.service.backend.shared.entity;

import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Data;
import com.service.backend.shared.enums.Status;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Table("organization_members")
public class OrganizationMember {

    @Id
    private Integer id;

    @Column("organization_id")
    private Integer organizationId;

    @Column("user_id")
    private Integer userId;

    @Column("graduated_year")
    private String graduatedYear;

    @Column("graduation_status")
    private Status graduationStatus;

    @Column("program")
    private String program;

    @Column("major")
    private String major;

    @Column("verification_level")
    private Integer verificationLevel;

    @Column("is_trusted_verifier")
    private Boolean isTrustedVerifier;

    private Status status;
    
    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    @Column("updated_at")
    private LocalDateTime updatedAt;
}
