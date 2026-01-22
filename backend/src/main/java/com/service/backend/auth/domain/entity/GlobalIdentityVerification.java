package com.service.backend.auth.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("global_identity_verifications")
public class GlobalIdentityVerification {

    @Id
    @Column("user_id")
    private Long userId;

    @Column("citizen_id")
    private String citizenId;

    @Column("extracted_data")
    private String extractedData; // JSON stored as String

    @Column("verified_at")
    private LocalDateTime verifiedAt;

    private String provider;
}
