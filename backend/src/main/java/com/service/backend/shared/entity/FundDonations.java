package com.service.backend.shared.entity;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import com.service.backend.shared.enums.FundDonationStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table("fund_donations")
public class FundDonations {
    @Id
    private Integer id;

    @Column("fund_id")
    private Integer fundId;

    @Column("donor_member_id")
    private Integer donorMemberId;

    @Column("donor_name")
    private String donorName;

    @Column("amount")
    private BigDecimal amount;

    @Column("address")
    private String address;

    @Column("phone")
    private String phone;

    @Column("email")
    private String email;

    @Column("message")
    private String message;

    @Column("status")
    private FundDonationStatus status;

    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;
}
