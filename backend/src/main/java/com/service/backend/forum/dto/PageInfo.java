package com.service.backend.forum.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PageInfo {
    private Integer currentPage;
    private Integer pageSize;
    private Integer totalPage;
    private Integer totalItem;
    private Boolean hasNext;
    private Boolean hasPrevious;
}
