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
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table("peer_verifications")
public class PeerVerification {

    @Id
    private Integer id;

    @Column("target_member_id")
    private Integer targetMemberId;

    @Column("verifier_member_id")
    private Integer verifierMemberId;

    private Status status;

    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;
}

