package com.service.backend.othermodule.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("fund_donations")
public class FundDonation {

    @Id
    private Long id;

    @Column("fund_id")
    private Long fundId;

    @Column("donor_member_id")
    private Long donorMemberId;

    @Column("donor_name")
    private String donorName;

    private BigDecimal amount;

    private String message;

    @Column("proof_image_url")
    private String proofImageUrl;

    private String status;

    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;
}
