package com.service.backend.shared.entity;

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
@Table("user_blocks")
public class UserBlock {

    @Id
    private Long id;

    @Column("blocker_member_id")
    private Long blockerMemberId;

    @Column("blocked_member_id")
    private Long blockedMemberId;

    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;
}
