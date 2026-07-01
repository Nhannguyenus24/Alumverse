package com.service.backend.fundraising.dto;

import com.service.backend.shared.entity.FundReceivingInfos;
import com.service.backend.shared.entity.Funds;
import com.service.backend.shared.entity.User;
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
    private String organizationName;
    private Integer donorCount;

    private String managerName;
    private String name;
    private String logoUrl;

    private String descriptionShort;
    private String descriptionFull;

    private BigDecimal targetAmount;
    private BigDecimal currentAmount;

    private LocalDateTime timeStarted;
    private LocalDateTime timeEnded;

    private String topic;

    private FundReceivingInfos fundReceivingInfo;

    private String managerEmail;
    private Integer managerUserId;
    private String managerAvatarUrl;

    public static FundDetailResponse from(
            Funds fund,
            FundReceivingInfos fundReceivingInfo,
            String organizationName,
            User managerUser
    ) {
        if (fund == null) {
            return null;
        }

        return FundDetailResponse.builder()
                .id(fund.getId())
                .organizationName(organizationName)
                .donorCount(fund.getDonorCount())
                .managerName(fund.getManagerName())
                .name(fund.getName())
                .logoUrl(fund.getLogoUrl())
                .descriptionShort(fund.getDescriptionShort())
                .descriptionFull(fund.getDescriptionFull())
                .targetAmount(fund.getTargetAmount())
                .currentAmount(fund.getCurrentAmount())
                .timeStarted(fund.getTimeStarted())
                .timeEnded(fund.getTimeEnded())
                .topic(fund.getTopic())
                .fundReceivingInfo(fundReceivingInfo)
                .managerEmail(fund.getManagerEmail())
                .managerUserId(managerUser != null ? managerUser.getId() : null)
                .managerAvatarUrl(managerUser != null ? managerUser.getAvatarUrl() : null)
                .build();
    }
}

