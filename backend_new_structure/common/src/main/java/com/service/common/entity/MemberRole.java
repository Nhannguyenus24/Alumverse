package com.service.common.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("member_roles")
public class MemberRole {

    @Column("member_id")
    private Long memberId;

    @Column("role_id")
    private Long roleId;

    @CreatedDate
    @Column("assigned_at")
    private LocalDateTime assignedAt;
}
