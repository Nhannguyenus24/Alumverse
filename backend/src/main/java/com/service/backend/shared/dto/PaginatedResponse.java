package com.service.backend.shared.dto;

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
    private Integer currentPage;
    private Integer pageSize;
    private Integer totalPage;
    private Long totalItem;
    private Boolean hasNext;
    private Boolean hasPrevious;

    public static <T> PaginatedResponse<T> of(List<T> items, long totalItems, int page, int limit) {
        int totalPages = limit > 0 ? (int) Math.ceil((double) totalItems / limit) : 0;
        return PaginatedResponse.<T>builder()
                .items(items)
                .currentPage(page)
                .pageSize(limit)
                .totalPage(totalPages)
                .totalItem(totalItems)
                .hasNext(page < totalPages - 1)
                .hasPrevious(page > 0)
                .build();
    }
}
