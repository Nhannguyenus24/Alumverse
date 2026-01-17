package com.service.backend.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("funds")
public class Fund {

    @Id
    private Long id;

    @Column("organization_id")
    private Long organizationId;

    @Column("manager_member_id")
    private Long managerMemberId;

    private String name;

    private String description;

    @Column("target_amount")
    private BigDecimal targetAmount;

    @Column("current_amount")
    private BigDecimal currentAmount;

    private String status;
}
