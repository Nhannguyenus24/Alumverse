package com.service.backend.fundraising.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateFundDonationVisibilityRequest {

    @NotNull(message = "Public status is required")
    private Boolean isPublic;
}
