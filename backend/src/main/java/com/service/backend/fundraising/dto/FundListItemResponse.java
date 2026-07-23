package com.service.backend.fundraising.dto;

import com.service.backend.shared.entity.Funds;
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
public class FundListItemResponse {
    private Integer id;
    private Integer organizationId;
    private Integer donorCount;

    private String managerName;
    private String name;
    private String logoUrl;

    private String descriptionShort;

    private BigDecimal targetAmount;
    private BigDecimal currentAmount;

    private LocalDateTime timeStarted;
    private LocalDateTime timeEnded;

    private String topic;

    private String fundDocumentUrl;

    private Boolean donationListPublic;

    public static FundListItemResponse from(Funds fund) {
        if (fund == null) {
            return null;
        }

        return FundListItemResponse.builder()
                .id(fund.getId())
                .organizationId(fund.getOrganizationId())
                .donorCount(fund.getDonorCount())
                .managerName(fund.getManagerName())
                .name(fund.getName())
                .logoUrl(fund.getLogoUrl())
                .descriptionShort(fund.getDescriptionShort())
                .targetAmount(fund.getTargetAmount())
                .currentAmount(fund.getCurrentAmount())
                .timeStarted(fund.getTimeStarted())
                .timeEnded(fund.getTimeEnded())
                .topic(fund.getTopic())
                .fundDocumentUrl(fund.getFundDocumentUrl())
                .donationListPublic(Boolean.TRUE.equals(fund.getDonationListPublic()))
                .build();
    }
}

