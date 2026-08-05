package com.service.backend.fundraising.mapper;

import com.service.backend.fundraising.constants.FundDonationConstants;
import com.service.backend.fundraising.dto.FundDonationListItemResponse;
import com.service.backend.fundraising.dto.PublicFundDonationListItemResponse;
import com.service.backend.fundraising.projection.FundDonationListProjection;

public final class FundDonationMapper {

    private FundDonationMapper() {
    }

    public static FundDonationListItemResponse toListItemResponse(FundDonationListProjection projection) {
        if (projection == null) {
            return null;
        }

        String donorDisplayName = resolveDonorDisplayName(projection.getDonorName());
        boolean isAnonymous = FundDonationConstants.DEFAULT_DONOR_DISPLAY_NAME.equals(donorDisplayName);

        return FundDonationListItemResponse.builder()
                .id(projection.getId())
                .fundId(projection.getFundId())
                .fundName(projection.getFundName())
                .donorMemberId(isAnonymous ? null : projection.getDonorMemberId())
                .donorName(donorDisplayName)
                .amount(projection.getAmount())
                .address(projection.getAddress())
                .phone(projection.getPhone())
                .email(projection.getEmail())
                .message(projection.getMessage())
                .status(projection.getStatus())
                .createdAt(projection.getCreatedAt())
                .avatarUrl(isAnonymous ? null : projection.getAvatarUrl())
                .build();
    }

    public static PublicFundDonationListItemResponse toPublicListItemResponse(FundDonationListProjection projection) {
        if (projection == null) {
            return null;
        }

        String donorDisplayName = resolveDonorDisplayName(projection.getDonorName());
        boolean isAnonymous = FundDonationConstants.DEFAULT_DONOR_DISPLAY_NAME.equals(donorDisplayName);

        return PublicFundDonationListItemResponse.builder()
                .id(projection.getId())
                .fundId(projection.getFundId())
                .fundName(projection.getFundName())
                .donorMemberId(isAnonymous ? null : projection.getDonorMemberId())
                .donorName(donorDisplayName)
                .amount(projection.getAmount())
                .message(projection.getMessage())
                .status(projection.getStatus())
                .createdAt(projection.getCreatedAt())
                .avatarUrl(isAnonymous ? null : projection.getAvatarUrl())
                .build();
    }

    /**
     * Guest donations may have {@code donor_member_id = null}; the display name is stored in
     * {@code donor_name} only. Member donations may fall back to profile name from the query.
     */
    public static String resolveDonorDisplayName(String donorName) {
        if (donorName == null || donorName.isBlank()) {
            return FundDonationConstants.DEFAULT_DONOR_DISPLAY_NAME;
        }
        return donorName.trim();
    }
}
