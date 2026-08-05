package com.service.backend.fundraising.mapper;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.service.backend.fundraising.constants.FundDonationConstants;
import com.service.backend.fundraising.dto.FundDonationListItemResponse;
import com.service.backend.fundraising.dto.PublicFundDonationListItemResponse;
import com.service.backend.fundraising.projection.FundDonationListProjection;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;

class FundDonationMapperTest {

    @Test
    void publicDonationResponseHasNoContactDetails() throws Exception {
        FundDonationListProjection projection = new FundDonationListProjection();
        projection.setDonorName("Nguyễn Văn A");
        projection.setAddress("Private address");
        projection.setPhone("0901234567");
        projection.setEmail("private@example.com");

        PublicFundDonationListItemResponse response = FundDonationMapper.toPublicListItemResponse(projection);
        JsonNode json = new ObjectMapper().readTree(new ObjectMapper().writeValueAsString(response));

        assertEquals("Nguyễn Văn A", response.getDonorName());
        assertFalse(json.has("address"));
        assertFalse(json.has("phone"));
        assertFalse(json.has("email"));
    }

    @Test
    void anonymousDonationDoesNotExposeMemberIdentity() {
        FundDonationListProjection projection = new FundDonationListProjection();
        projection.setDonorMemberId(11);
        projection.setDonorName(FundDonationConstants.DEFAULT_DONOR_DISPLAY_NAME);
        projection.setAvatarUrl("https://example.com/private-avatar.webp");

        FundDonationListItemResponse response = FundDonationMapper.toListItemResponse(projection);

        assertEquals(FundDonationConstants.DEFAULT_DONOR_DISPLAY_NAME, response.getDonorName());
        assertNull(response.getDonorMemberId());
        assertNull(response.getAvatarUrl());
    }

    @Test
    void blankDonorNameIsTreatedAsAnonymous() {
        FundDonationListProjection projection = new FundDonationListProjection();
        projection.setDonorMemberId(11);
        projection.setDonorName("   ");
        projection.setAvatarUrl("https://example.com/private-avatar.webp");

        FundDonationListItemResponse response = FundDonationMapper.toListItemResponse(projection);

        assertEquals(FundDonationConstants.DEFAULT_DONOR_DISPLAY_NAME, response.getDonorName());
        assertNull(response.getDonorMemberId());
        assertNull(response.getAvatarUrl());
    }

    @Test
    void namedDonationKeepsMemberIdentity() {
        FundDonationListProjection projection = new FundDonationListProjection();
        projection.setDonorMemberId(11);
        projection.setDonorName("  Nguyễn Văn A  ");
        projection.setAvatarUrl("https://example.com/avatar.webp");

        FundDonationListItemResponse response = FundDonationMapper.toListItemResponse(projection);

        assertEquals("Nguyễn Văn A", response.getDonorName());
        assertEquals(11, response.getDonorMemberId());
        assertEquals("https://example.com/avatar.webp", response.getAvatarUrl());
    }
}
