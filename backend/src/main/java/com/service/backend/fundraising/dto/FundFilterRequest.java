package com.service.backend.fundraising.dto;

import lombok.Builder;
import jakarta.validation.constraints.*;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Builder
public class FundFilterRequest {
    @Size(max = 255)

    private String q;
    @Size(max = 255)

    private String organizationId;
    @Size(max = 255)

    private String timeStartedFrom;
    @Size(max = 255)

    private String timeStartedTo;
    @Size(max = 255)

    private String targetAmountMin;
    @Size(max = 255)

    private String targetAmountMax;
    @Size(max = 255)

    private String sortBy;     // only donor_count accepted
    @Size(max = 255)

    private String direction;  // asc | desc
    private int page;
    private int size;
}

