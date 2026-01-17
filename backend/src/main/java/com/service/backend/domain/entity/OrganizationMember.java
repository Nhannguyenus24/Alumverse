package com.service.backend.domain.entity;

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
@Table("organization_members")
public class OrganizationMember {

    @Id
    private Long id;

    @Column("organization_id")
    private Long organizationId;

    @Column("user_id")
    private Long userId;

    @Column("display_name")
    private String displayName;

    @Column("org_specific_avatar_url")
    private String orgSpecificAvatarUrl;

    @Column("verification_level")
    @Builder.Default
    private Integer verificationLevel = 0;

    @Column("is_trusted_verifier")
    @Builder.Default
    private Boolean isTrustedVerifier = false;

    @Builder.Default
    private String status = "Active";

    @CreatedDate
    @Column("joined_at")
    private LocalDateTime joinedAt;
}
