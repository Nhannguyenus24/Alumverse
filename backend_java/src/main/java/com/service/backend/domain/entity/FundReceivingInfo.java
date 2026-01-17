package com.service.backend.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("fund_receiving_infos")
public class FundReceivingInfo {

    @Id
    private Long id;

    @Column("fund_id")
    private Long fundId;

    private String type;

    @Column("account_number")
    private String accountNumber;

    @Column("account_name")
    private String accountName;

    @Column("bank_name")
    private String bankName;

    @Column("qr_code_url")
    private String qrCodeUrl;

    @Column("is_active")
    private Boolean isActive;
}
