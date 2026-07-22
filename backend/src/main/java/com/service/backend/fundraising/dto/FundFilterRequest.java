package com.service.backend.fundraising.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FundFilterRequest {
    private String q;
    private String organizationId;
    private String timeStartedFrom;
    private String timeStartedTo;
    private String targetAmountMin;
    private String targetAmountMax;
    private String sortBy;     // only donor_count accepted
    private String direction;  // asc | desc
    private int page;
    private int size;
}

