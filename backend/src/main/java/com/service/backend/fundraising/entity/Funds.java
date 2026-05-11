package com.service.backend.fundraising.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table("funds")
public class Funds {
    @Id
    private Integer id;

    @Column("organization_id")
    private Integer organizationId;

    @Column("manager_name")
    private String managerName;

    @Column("name")
    private String name;

    @Column("logo_url")
    private String logoUrl;

    @Column("fund_receiving_info_id")
    private Integer fundReceivingInfoId;

    @Column("description_short")
    private String descriptionShort;

    @Column("description_full")
    private String descriptionFull;

    @Column("target_amount")
    private BigDecimal targetAmount;

    @Column("current_amount")
    private BigDecimal currentAmount;

    @Column("time_started")
    private LocalDateTime timeStarted;

    @Column("donor_count")
    private Integer donorCount;

    @Column("status_id")
    private Integer statusId;

    @Column("topic")
    private String topic;

    @Column("time_ended")
    private LocalDateTime timeEnded;
}
