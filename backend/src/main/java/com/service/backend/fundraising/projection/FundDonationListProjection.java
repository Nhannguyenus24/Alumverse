package com.service.backend.fundraising.projection;

import com.service.backend.shared.enums.Status;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.relational.core.mapping.Column;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO projection for fund-donation list queries.
 *
 * Must be a concrete class (not an interface): the list queries pull
 * fund_name (from funds) and avatar_url (from users) via JOIN. Spring Data
 * R2DBC populates interface projections by reading the repository aggregate
 * (FundDonations) first, so columns that are not fields of that entity —
 * exactly fund_name and avatar_url — come back null. A class-based DTO
 * projection is mapped directly from the result columns, so joined columns
 * bind correctly. Column names are declared explicitly (matching the SQL
 * aliases) because this codebase does not enable snake_case naming.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FundDonationListProjection {

    @Column("id")
    private Integer id;

    @Column("fund_id")
    private Integer fundId;

    @Column("fund_name")
    private String fundName;

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
    private Status status;

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("avatar_url")
    private String avatarUrl;
}
