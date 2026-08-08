package com.service.backend.shared.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Advisory AI assessment for a proof-based verification request.
 * The administrator remains the only actor allowed to approve or reject.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerificationRecommendationResponse {
    /** APPROVE | REVIEW | REJECT | PENDING. */
    private String verdict;
    private String summary;
    private List<String> reasons;
    private List<String> mismatches;
    /** False when the deterministic safety fallback produced the response. */
    private Boolean generatedByAi;
    private String disclaimer;
}
