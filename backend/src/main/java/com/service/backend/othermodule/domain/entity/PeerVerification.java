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
@Table("peer_verifications")
public class PeerVerification {

    @Id
    private Long id;

    @Column("target_member_id")
    private Long targetMemberId;

    @Column("verifier_member_id")
    private Long verifierMemberId;

    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;
}
