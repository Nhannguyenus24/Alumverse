package com.service.backend.fundraising.dto;

import com.service.backend.shared.enums.Status;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FundDonationListItemResponse {
    private Integer id;
    private Integer fundId;
    private Integer donorMemberId;
    private String donorName;
    private BigDecimal amount;
    private String address;
    private String phone;
    private String email;
    private String message;
    private Status status;
    private LocalDateTime createdAt;
    private String avatarUrl;
}
