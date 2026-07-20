package com.service.backend.fundraising.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Projection for the single funds→fund_receiving_infos LEFT JOIN lookup. Carries enough state to
 * reproduce the original three error cases without a second query:
 * <ul>
 *   <li>no row at all → fund does not exist</li>
 *   <li>{@code fundReceivingInfoId == null} → fund has no receiving info configured</li>
 *   <li>{@code fundReceivingInfoId != null} but {@code riId == null} → configured id points at a missing row</li>
 * </ul>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FundReceivingInfoLookup {
    private Long fundId;
    private Integer fundReceivingInfoId;
    private Integer riId;
    private String riAccountNumber;
    private String riAccountName;
    private String riBankName;
    private Boolean riIsActive;
}
