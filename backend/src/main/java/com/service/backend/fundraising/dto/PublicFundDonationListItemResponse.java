package com.service.backend.fundraising.dto;

import com.service.backend.shared.enums.Status;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Public donation data. Donor contact details must not be exposed here. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicFundDonationListItemResponse {
    private Integer id;
    private Integer fundId;
    private String fundName;
    private Integer donorMemberId;
    private String donorName;
    private BigDecimal amount;
    private String message;
    private Status status;
    private LocalDateTime createdAt;
    private String avatarUrl;
}
