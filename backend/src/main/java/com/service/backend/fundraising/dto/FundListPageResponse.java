package com.service.backend.fundraising.dto;

import com.service.backend.shared.dto.PaginatedResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FundListPageResponse {
    private FundListItemResponse featured;
    private List<FundListItemResponse> items;
    private Integer currentPage;
    private Integer pageSize;
    private Integer totalPage;
    private Long totalItem;
    private Boolean hasNext;
    private Boolean hasPrevious;

    public static FundListPageResponse of(
            FundListItemResponse featured,
            PaginatedResponse<FundListItemResponse> page
    ) {
        return FundListPageResponse.builder()
                .featured(featured)
                .items(page.getItems())
                .currentPage(page.getCurrentPage())
                .pageSize(page.getPageSize())
                .totalPage(page.getTotalPage())
                .totalItem(page.getTotalItem())
                .hasNext(page.getHasNext())
                .hasPrevious(page.getHasPrevious())
                .build();
    }
}
