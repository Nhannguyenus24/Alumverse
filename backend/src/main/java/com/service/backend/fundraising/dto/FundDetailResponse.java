package com.service.backend.fundraising.dto;

import com.service.backend.fundraising.entity.FundReceivingInfos;
import com.service.backend.fundraising.entity.Funds;
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
public class FundDetailResponse {
    private Integer id;
    private Integer organizationId;
    private Integer statusId;
    private Integer donorCount;

    private String managerName;
    private String name;
    private String logoUrl;

    // KO return descriptionShort trong detail endpoint
    private String descriptionFull;

    private BigDecimal targetAmount;
    private BigDecimal currentAmount;

    private LocalDateTime timeStarted;
    private LocalDateTime timeEnded;

    private String qrImageUrl;

    private FundReceivingInfos fundReceivingInfo;

    public static FundDetailResponse from(Funds fund, FundReceivingInfos fundReceivingInfo) {
        if (fund == null) {
            return null;
        }

        return FundDetailResponse.builder()
                .id(fund.getId())
                .organizationId(fund.getOrganizationId())
                .statusId(fund.getStatusId())
                .donorCount(fund.getDonorCount())
                .managerName(fund.getManagerName())
                .name(fund.getName())
                .logoUrl(fund.getLogoUrl())
                .descriptionFull(fund.getDescriptionFull())
                .targetAmount(fund.getTargetAmount())
                .currentAmount(fund.getCurrentAmount())
                .timeStarted(fund.getTimeStarted())
                .timeEnded(fund.getTimeEnded())
                .qrImageUrl(fund.getQrImageUrl())
                .fundReceivingInfo(fundReceivingInfo)
                .build();
    }
}

