package com.service.backend.shared.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table("fund_receiving_infos")
public class FundReceivingInfos {
    @Id
    private Integer id;

    @Column("account_number")
    private String accountNumber;

    @Column("account_name")
    private String accountName;

    @Column("bank_name")
    private String bankName;

    @Column("is_active")
    private boolean isActive;
}
