package com.service.common.entity;

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
@Table("otp_codes")
public class OtpCode {

    @Id
    private Long id;

    @Column("user_id")
    private Long userId;

    private String email;

    private String purpose; // VERIFY_EMAIL, RESET_PASSWORD

    @Column("otp_hash")
    private String otpHash;

    @Column("expires_at")
    private LocalDateTime expiresAt;

    private Boolean used;

    @Column("created_at")
    private LocalDateTime createdAt;
}
