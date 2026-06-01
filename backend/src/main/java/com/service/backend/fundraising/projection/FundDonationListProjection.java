package com.service.backend.fundraising.projection;

import com.service.backend.shared.enums.FundDonationStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public interface FundDonationListProjection {
    Integer getId();

    Integer getFundId();

    Integer getDonorMemberId();

    String getDonorName();

    BigDecimal getAmount();

    String getAddress();

    String getPhone();

    String getEmail();

    String getMessage();

    FundDonationStatus getStatus();

    LocalDateTime getCreatedAt();

    String getAvatarUrl();
}
