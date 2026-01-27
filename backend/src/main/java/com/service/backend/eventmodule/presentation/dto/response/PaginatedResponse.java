package com.service.backend.eventmodule.presentation.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaginatedResponse<T> {

    private List<T> items;
    private Long total;
    private Integer page;
    private Integer limit;
    private Integer totalPages;

    public static <T> PaginatedResponse<T> of(List<T> items, Long total, int page, int limit) {
        int totalPages = (int) Math.ceil((double) total / limit);
        return PaginatedResponse.<T>builder()
                .items(items)
                .total(total)
                .page(page)
                .limit(limit)
                .totalPages(totalPages)
                .build();
    }
}
